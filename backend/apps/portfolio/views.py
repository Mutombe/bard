"""
Portfolio Views
"""
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.markets.models import Company

from .models import (
    Portfolio,
    Position,
    Transaction,
    Dividend,
    PortfolioSnapshot,
    PortfolioPerformance,
    WatchlistItem,
)
from .serializers import (
    PortfolioSerializer,
    PortfolioListSerializer,
    PortfolioCreateSerializer,
    PortfolioSummarySerializer,
    PositionSerializer,
    TransactionSerializer,
    TransactionCreateSerializer,
    DividendSerializer,
    PortfolioSnapshotSerializer,
    WatchlistItemSerializer,
)


class PortfolioViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Portfolio management.

    Endpoints:
    - GET /portfolios/ - List user's portfolios
    - POST /portfolios/ - Create portfolio
    - GET /portfolios/{id}/ - Get portfolio details
    - PUT /portfolios/{id}/ - Update portfolio
    - DELETE /portfolios/{id}/ - Delete portfolio
    - GET /portfolios/{id}/positions/ - Get positions
    - GET /portfolios/{id}/transactions/ - Get transactions
    - GET /portfolios/{id}/history/ - Get value history
    - GET /portfolios/summary/ - Get summary of all portfolios
    """

    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Portfolio.objects.filter(
            user=self.request.user
        ).prefetch_related("positions", "positions__company")

    def get_serializer_class(self):
        if self.action == "list":
            return PortfolioListSerializer
        if self.action == "create":
            return PortfolioCreateSerializer
        return PortfolioSerializer

    @action(detail=True, methods=["get"])
    def positions(self, request, id=None):
        """Get all positions in portfolio."""
        portfolio = self.get_object()
        positions = portfolio.positions.select_related("company")
        serializer = PositionSerializer(positions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def transactions(self, request, id=None):
        """Get transaction history."""
        portfolio = self.get_object()
        transactions = portfolio.transactions.select_related("company")

        # Filter by type
        tx_type = request.query_params.get("type")
        if tx_type:
            transactions = transactions.filter(transaction_type=tx_type)

        # Filter by company
        company_id = request.query_params.get("company")
        if company_id:
            transactions = transactions.filter(company_id=company_id)

        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = TransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def dividends(self, request, id=None):
        """Get dividend history."""
        portfolio = self.get_object()
        dividends = portfolio.dividends.select_related("company")

        page = self.paginate_queryset(dividends)
        if page is not None:
            serializer = DividendSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DividendSerializer(dividends, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def history(self, request, id=None):
        """Get portfolio value history."""
        portfolio = self.get_object()
        days = int(request.query_params.get("days", 30))

        snapshots = PortfolioSnapshot.objects.filter(
            portfolio=portfolio
        ).order_by("-date")[:days]

        serializer = PortfolioSnapshotSerializer(snapshots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def allocation(self, request, id=None):
        """Get portfolio allocation breakdown."""
        portfolio = self.get_object()
        positions = portfolio.positions.select_related(
            "company", "company__sector"
        )

        total_value = portfolio.total_value or Decimal("1")

        # By position
        by_position = [
            {
                "symbol": p.company.symbol,
                "name": p.company.name,
                "value": float(p.market_value),
                "percent": float((p.market_value / total_value) * 100),
            }
            for p in positions
        ]

        # By sector
        sector_values = {}
        for p in positions:
            sector = p.company.sector.name if p.company.sector else "Unknown"
            sector_values[sector] = sector_values.get(sector, 0) + float(p.market_value)

        by_sector = [
            {
                "sector": sector,
                "value": value,
                "percent": (value / float(total_value)) * 100,
            }
            for sector, value in sector_values.items()
        ]

        # Cash allocation
        cash_percent = float((portfolio.cash_balance / total_value) * 100)

        return Response({
            "by_position": sorted(by_position, key=lambda x: x["percent"], reverse=True),
            "by_sector": sorted(by_sector, key=lambda x: x["percent"], reverse=True),
            "cash": {
                "value": float(portfolio.cash_balance),
                "percent": cash_percent,
            },
        })

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get summary of all user portfolios."""
        portfolios = self.get_queryset()

        total_value = Decimal("0")
        total_cost = Decimal("0")
        total_cash = Decimal("0")
        total_positions = 0
        best = None
        worst = None

        for p in portfolios:
            total_value += p.total_value
            total_cost += p.total_cost
            total_cash += p.cash_balance
            total_positions += p.positions.count()

            for pos in p.positions.all():
                pct = pos.unrealized_gain_loss_percent
                if best is None or pct > best["gain_percent"]:
                    best = {
                        "symbol": pos.company.symbol,
                        "name": pos.company.name,
                        "gain_percent": float(pct),
                    }
                if worst is None or pct < worst["gain_percent"]:
                    worst = {
                        "symbol": pos.company.symbol,
                        "name": pos.company.name,
                        "gain_percent": float(pct),
                    }

        total_gain = total_value - total_cost - total_cash
        gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else Decimal("0")

        summary = {
            "total_portfolios": portfolios.count(),
            "total_value": total_value,
            "total_gain_loss": total_gain,
            "total_gain_loss_percent": gain_pct,
            "total_positions": total_positions,
            "total_cash": total_cash,
            "best_performer": best,
            "worst_performer": worst,
        }

        serializer = PortfolioSummarySerializer(summary)
        return Response(serializer.data)


class PositionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Position management.
    """

    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Position.objects.filter(
            portfolio__user=self.request.user
        ).select_related("company", "portfolio")

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """Get transactions for this position."""
        position = self.get_object()
        transactions = Transaction.objects.filter(
            portfolio=position.portfolio,
            company=position.company
        ).order_by("-date")

        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Transaction management.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(
            portfolio__user=self.request.user
        ).select_related("company", "portfolio")

    def get_serializer_class(self):
        if self.action == "create":
            return TransactionCreateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        transaction = serializer.save()
        self._update_position(transaction)
        self._update_cash(transaction)

    def _update_position(self, transaction):
        """Update position after transaction."""
        if not transaction.company:
            return

        portfolio = transaction.portfolio
        company = transaction.company

        try:
            position = Position.objects.get(
                portfolio=portfolio,
                company=company
            )
        except Position.DoesNotExist:
            position = None

        if transaction.transaction_type == "buy":
            if position:
                # Update average cost
                old_value = position.quantity * position.average_cost
                new_value = transaction.quantity * transaction.price
                total_qty = position.quantity + transaction.quantity
                position.quantity = total_qty
                position.average_cost = (old_value + new_value) / total_qty
                position.last_transaction_date = transaction.date
                position.save()
            else:
                # Create new position
                Position.objects.create(
                    portfolio=portfolio,
                    company=company,
                    quantity=transaction.quantity,
                    average_cost=transaction.price,
                    first_purchase_date=transaction.date,
                    last_transaction_date=transaction.date,
                )

        elif transaction.transaction_type == "sell":
            if position:
                position.quantity -= transaction.quantity
                position.last_transaction_date = transaction.date
                if position.quantity <= 0:
                    position.delete()
                else:
                    position.save()

    def _update_cash(self, transaction):
        """Update cash balance after transaction."""
        portfolio = transaction.portfolio
        amount = transaction.total_cost

        if transaction.transaction_type == "buy":
            portfolio.cash_balance -= amount
        elif transaction.transaction_type == "sell":
            portfolio.cash_balance += amount
        elif transaction.transaction_type == "deposit":
            portfolio.cash_balance += transaction.amount
        elif transaction.transaction_type == "withdrawal":
            portfolio.cash_balance -= transaction.amount
        elif transaction.transaction_type == "dividend":
            portfolio.cash_balance += transaction.amount

        portfolio.save()


class WatchlistViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Watchlist management.
    """

    serializer_class = WatchlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchlistItem.objects.filter(
            portfolio__user=self.request.user
        ).select_related("company", "portfolio")

    def perform_create(self, serializer):
        # Get default portfolio or first one
        portfolio = Portfolio.objects.filter(
            user=self.request.user,
            is_default=True
        ).first() or Portfolio.objects.filter(
            user=self.request.user
        ).first()

        if not portfolio:
            # Create default portfolio
            portfolio = Portfolio.objects.create(
                user=self.request.user,
                name="My Portfolio",
                is_default=True,
            )

        serializer.save(portfolio=portfolio)

    @action(detail=False, methods=["get"])
    def alerts(self, request):
        """Get items with triggered price alerts."""
        items = self.get_queryset().filter(alert_on_target=True)

        triggered = []
        for item in items:
            current = item.company.tickers.filter(is_primary=True).first()
            if not current:
                continue

            price = current.last_price

            if item.target_buy_price and price <= item.target_buy_price:
                triggered.append({
                    "item": WatchlistItemSerializer(item).data,
                    "alert_type": "buy_target",
                    "current_price": float(price),
                    "target_price": float(item.target_buy_price),
                })
            elif item.target_sell_price and price >= item.target_sell_price:
                triggered.append({
                    "item": WatchlistItemSerializer(item).data,
                    "alert_type": "sell_target",
                    "current_price": float(price),
                    "target_price": float(item.target_sell_price),
                })

        return Response(triggered)
