"""
Custom Pagination Classes

Provides standardized pagination for all API endpoints.
"""
from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    """
    Standard page-based pagination for most endpoints.

    Response format:
    {
        "count": 100,
        "total_pages": 5,
        "current_page": 1,
        "next": "http://api/endpoint/?page=2",
        "previous": null,
        "results": [...]
    }
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


class MarketDataPagination(CursorPagination):
    """
    Cursor-based pagination for high-frequency market data.

    Optimized for:
    - Large datasets with frequent updates
    - Consistent ordering (no duplicates on page changes)
    - Efficient database queries with indexed cursor
    """

    page_size = 50
    ordering = "-timestamp"
    cursor_query_param = "cursor"

    def get_paginated_response(self, data):
        return Response(
            {
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


class InfiniteScrollPagination(CursorPagination):
    """
    Infinite scroll pagination for news feeds.

    Optimized for mobile-friendly infinite scroll UX.
    Supports page_size query param for larger batch requests.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    ordering = "-published_at"
    cursor_query_param = "cursor"
