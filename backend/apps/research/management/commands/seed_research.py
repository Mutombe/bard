"""
Seed research and podcast data for development/demo.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.research.models import Topic, Industry, ResearchReport
from apps.podcasts.models import PodcastShow, PodcastEpisode
from apps.users.models import User


class Command(BaseCommand):
    help = "Seed research reports, topics, industries, and podcasts"

    def handle(self, *args, **options):
        self.stdout.write("Seeding research and podcast data...")

        # Get or create admin user for authorship
        admin_user = User.objects.filter(is_staff=True).first()
        if not admin_user:
            admin_user = User.objects.first()

        # Create Topics
        topics_data = [
            {"name": "Central Banks & Monetary Policy", "slug": "central-banks", "description": "Coverage of SARB, CBN, CBK, and other African central banks", "icon": "Landmark", "color": "#3B82F6", "is_featured": True},
            {"name": "Fintech & Digital Finance", "slug": "fintech", "description": "Mobile money, digital banking, and fintech innovation", "icon": "Smartphone", "color": "#8B5CF6", "is_featured": True},
            {"name": "Trade Policy & AfCFTA", "slug": "trade-policy", "description": "African Continental Free Trade Area and trade agreements", "icon": "Globe", "color": "#10B981", "is_featured": True},
            {"name": "Commodities & Resources", "slug": "commodities", "description": "Gold, oil, platinum, agricultural commodities", "icon": "Gem", "color": "#F59E0B", "is_featured": False},
            {"name": "Sustainable Finance & ESG", "slug": "sustainability", "description": "Green bonds, climate finance, ESG investing", "icon": "Leaf", "color": "#22C55E", "is_featured": True},
            {"name": "Private Equity & Venture Capital", "slug": "private-equity", "description": "PE deals, VC funding, startup investments", "icon": "TrendingUp", "color": "#EC4899", "is_featured": False},
            {"name": "Foreign Direct Investment", "slug": "fdi", "description": "FDI flows, investment treaties, country analysis", "icon": "Building", "color": "#6366F1", "is_featured": False},
            {"name": "Cryptocurrency & Blockchain", "slug": "crypto", "description": "Digital assets, DeFi, blockchain adoption in Africa", "icon": "Bitcoin", "color": "#F97316", "is_featured": False},
        ]

        topics = {}
        for t in topics_data:
            topic, created = Topic.objects.update_or_create(
                slug=t["slug"],
                defaults=t
            )
            topics[t["slug"]] = topic
            status = "Created" if created else "Updated"
            self.stdout.write(f"  {status} topic: {topic.name}")

        # Create Industries
        industries_data = [
            {"name": "Banking & Financial Services", "slug": "banking", "description": "Commercial banks, investment banks, insurance companies", "icon": "Landmark", "color": "#3B82F6", "is_featured": True},
            {"name": "Mining & Resources", "slug": "mining", "description": "Gold, platinum, diamonds, coal, iron ore mining", "icon": "Pickaxe", "color": "#78716C", "is_featured": True},
            {"name": "Technology & Fintech", "slug": "technology", "description": "Software, fintech, telecommunications technology", "icon": "Cpu", "color": "#8B5CF6", "is_featured": True},
            {"name": "Agriculture & Agribusiness", "slug": "agriculture", "description": "Farming, food processing, agricultural commodities", "icon": "Wheat", "color": "#22C55E", "is_featured": False},
            {"name": "Infrastructure & Energy", "slug": "infrastructure", "description": "Power generation, construction, utilities", "icon": "Zap", "color": "#F59E0B", "is_featured": True},
            {"name": "Telecommunications", "slug": "telecommunications", "description": "Mobile operators, ISPs, telecom infrastructure", "icon": "Radio", "color": "#06B6D4", "is_featured": False},
            {"name": "Real Estate & Construction", "slug": "real-estate", "description": "Property development, REITs, construction", "icon": "Building2", "color": "#64748B", "is_featured": False},
            {"name": "Consumer Goods & Retail", "slug": "consumer-goods", "description": "FMCG, retail chains, e-commerce", "icon": "ShoppingBag", "color": "#EC4899", "is_featured": False},
            {"name": "Healthcare & Pharmaceuticals", "slug": "healthcare", "description": "Hospitals, pharma, medical devices", "icon": "Heart", "color": "#EF4444", "is_featured": False},
            {"name": "Manufacturing", "slug": "manufacturing", "description": "Industrial production, automotive, chemicals", "icon": "Factory", "color": "#78716C", "is_featured": False},
        ]

        industries = {}
        for i in industries_data:
            industry, created = Industry.objects.update_or_create(
                slug=i["slug"],
                defaults=i
            )
            industries[i["slug"]] = industry
            status = "Created" if created else "Updated"
            self.stdout.write(f"  {status} industry: {industry.name}")

        # Create Research Reports
        reports_data = [
            {
                "title": "African Banking Sector Outlook 2025",
                "slug": "african-banking-outlook-2025",
                "subtitle": "Comprehensive analysis of banking trends across the continent",
                "abstract": "This comprehensive report examines the state of banking across Africa's major economies, analyzing digital transformation initiatives, regulatory changes, and growth opportunities. We provide detailed forecasts for the sector through 2025 and beyond, with specific focus on South Africa, Nigeria, Kenya, and Egypt.",
                "content": "<h2>Executive Summary</h2><p>African banking is undergoing rapid transformation driven by digital innovation, regulatory reform, and changing consumer expectations. This report provides comprehensive analysis of key trends shaping the sector.</p><h2>Key Findings</h2><p>Digital banking adoption has accelerated across all major markets, with mobile money transactions exceeding $700 billion annually. Traditional banks are investing heavily in digital infrastructure to compete with agile fintech players.</p><h2>Regional Analysis</h2><p>South Africa remains the continent's most developed banking market, while Nigeria and Kenya lead in mobile money innovation. Egyptian banks are expanding across North Africa.</p>",
                "key_findings": [
                    "Digital banking adoption increased 45% year-over-year",
                    "Mobile money transactions exceeded $700 billion",
                    "Pan-African banking networks are consolidating",
                    "ESG lending grew by 60% across major markets",
                    "Interest margins are compressing due to competition"
                ],
                "methodology": "This report combines quantitative analysis of financial statements from 50+ major African banks with qualitative insights from interviews with 25 banking executives across 12 countries.",
                "report_type": "outlook",
                "status": "published",
                "is_featured": True,
                "is_premium": True,
                "view_count": 5678,
                "download_count": 1234,
                "page_count": 48,
            },
            {
                "title": "Mobile Money Revolution: Africa's Financial Transformation",
                "slug": "mobile-money-revolution-africa",
                "subtitle": "How mobile money is reshaping financial inclusion across the continent",
                "abstract": "An in-depth examination of mobile money's explosive growth across Africa, covering M-Pesa's dominance, emerging competitors, regulatory frameworks, and the technology's role in driving financial inclusion for millions of previously unbanked citizens.",
                "content": "<h2>The Mobile Money Phenomenon</h2><p>Africa leads the world in mobile money adoption, with over 600 million registered accounts processing billions of dollars in transactions annually. This report examines the factors driving this growth and its implications for traditional banking.</p><h2>Market Leaders</h2><p>M-Pesa remains the dominant player, but new entrants are challenging its position with innovative offerings. MTN Mobile Money, Orange Money, and Airtel Money are gaining ground.</p>",
                "key_findings": [
                    "600+ million registered mobile money accounts in Africa",
                    "Transaction values grew 40% year-over-year",
                    "Interoperability improving across borders",
                    "Regulatory frameworks maturing in key markets"
                ],
                "methodology": "Analysis based on data from mobile network operators, central banks, and field research across 15 African countries.",
                "report_type": "analysis",
                "status": "published",
                "is_featured": True,
                "is_premium": False,
                "view_count": 4321,
                "download_count": 987,
                "page_count": 36,
            },
            {
                "title": "ESG Investment Trends in African Markets",
                "slug": "esg-investment-trends-africa",
                "subtitle": "Sustainable finance and responsible investing across the continent",
                "abstract": "This report analyzes the growing importance of Environmental, Social, and Governance (ESG) factors in African investment decisions, examining green bond issuances, sustainable finance frameworks, and investor expectations.",
                "content": "<h2>ESG Momentum in Africa</h2><p>ESG investing is gaining significant traction across African markets, driven by international investor requirements and local sustainability initiatives. Green bond issuances have surged, and more companies are adopting sustainability reporting standards.</p>",
                "key_findings": [
                    "Green bond issuances up 80% year-over-year",
                    "ESG-focused funds raised $2.5 billion",
                    "South Africa leads in sustainability reporting",
                    "Climate finance gaps remain significant"
                ],
                "methodology": "Review of ESG disclosures, green bond prospectuses, and investor surveys across major African markets.",
                "report_type": "analysis",
                "status": "published",
                "is_featured": False,
                "is_premium": True,
                "view_count": 2156,
                "download_count": 543,
                "page_count": 28,
            },
            {
                "title": "AfCFTA Implementation Progress Report",
                "slug": "afcfta-implementation-progress",
                "subtitle": "Tracking the African Continental Free Trade Area rollout",
                "abstract": "A comprehensive assessment of the African Continental Free Trade Area implementation, examining tariff reductions, rules of origin negotiations, and early trade flow impacts across member states.",
                "content": "<h2>AfCFTA: One Year On</h2><p>The African Continental Free Trade Area represents the world's largest free trade zone by number of countries. This report tracks implementation progress and identifies opportunities for businesses.</p>",
                "key_findings": [
                    "43 countries have ratified the agreement",
                    "Tariff reductions proceeding on schedule",
                    "Rules of origin negotiations 70% complete",
                    "Trade facilitation remains a challenge"
                ],
                "methodology": "Analysis of official AfCFTA documents, trade statistics, and interviews with trade negotiators.",
                "report_type": "special",
                "status": "published",
                "is_featured": True,
                "is_premium": False,
                "view_count": 8934,
                "download_count": 2156,
                "page_count": 42,
            },
            {
                "title": "Mining Sector Quarterly Review Q4 2024",
                "slug": "mining-quarterly-q4-2024",
                "subtitle": "Performance analysis of Africa's mining sector",
                "abstract": "Quarterly analysis of Africa's mining sector covering production volumes, commodity prices, major deals, and regulatory developments across gold, platinum, copper, and coal.",
                "content": "<h2>Q4 Mining Review</h2><p>The African mining sector showed resilience in Q4 2024 despite global headwinds. Gold production reached record levels while battery metals attracted significant investment.</p>",
                "key_findings": [
                    "Gold production up 12% quarter-over-quarter",
                    "Battery metal investments surged",
                    "ESG pressures driving operational changes",
                    "Junior miners facing funding challenges"
                ],
                "methodology": "Production data from mining companies and government statistics agencies.",
                "report_type": "quarterly",
                "status": "published",
                "is_featured": False,
                "is_premium": True,
                "view_count": 1567,
                "download_count": 456,
                "page_count": 24,
            },
        ]

        for idx, r in enumerate(reports_data):
            published_at = timezone.now() - timedelta(days=idx * 15)
            report, created = ResearchReport.objects.update_or_create(
                slug=r["slug"],
                defaults={
                    **r,
                    "lead_author": admin_user,
                    "published_at": published_at,
                }
            )
            # Add topics and industries
            if "banking" in r["slug"].lower():
                report.topics.add(topics["central-banks"], topics["fintech"])
                report.industries.add(industries["banking"])
            elif "mobile" in r["slug"].lower():
                report.topics.add(topics["fintech"])
                report.industries.add(industries["banking"], industries["technology"])
            elif "esg" in r["slug"].lower():
                report.topics.add(topics["sustainability"])
                report.industries.add(industries["banking"])
            elif "afcfta" in r["slug"].lower():
                report.topics.add(topics["trade-policy"])
            elif "mining" in r["slug"].lower():
                report.topics.add(topics["commodities"])
                report.industries.add(industries["mining"])

            status = "Created" if created else "Updated"
            self.stdout.write(f"  {status} report: {report.title}")

        # Create Podcast Shows
        shows_data = [
            {
                "name": "African Markets Today",
                "slug": "african-markets-today",
                "tagline": "Daily insights on African financial markets",
                "description": "Your daily briefing on African financial markets. Each episode covers market movements, breaking news, and expert analysis from across the continent's major exchanges.",
                "short_description": "Daily market briefings and analysis",
                "frequency": "Daily",
                "publish_day": "Weekdays",
                "status": "active",
                "is_featured": True,
                "total_listens": 125000,
                "subscriber_count": 8500,
            },
            {
                "name": "The Research Briefing",
                "slug": "research-briefing",
                "tagline": "Deep dives into African economic research",
                "description": "In-depth discussions with our research team about their latest reports and findings. Each episode explores key themes shaping African economies and markets.",
                "short_description": "Expert analysis and research insights",
                "frequency": "Weekly",
                "publish_day": "Wednesday",
                "status": "active",
                "is_featured": True,
                "total_listens": 45000,
                "subscriber_count": 3200,
            },
            {
                "name": "Executive Conversations",
                "slug": "executive-conversations",
                "tagline": "Interviews with Africa's business leaders",
                "description": "One-on-one interviews with CEOs, founders, and executives shaping Africa's business landscape. Candid conversations about strategy, challenges, and opportunities.",
                "short_description": "Interviews with Africa's top executives",
                "frequency": "Bi-weekly",
                "publish_day": "Friday",
                "status": "active",
                "is_featured": False,
                "total_listens": 28000,
                "subscriber_count": 2100,
            },
        ]

        shows = {}
        for s in shows_data:
            show, created = PodcastShow.objects.update_or_create(
                slug=s["slug"],
                defaults=s
            )
            shows[s["slug"]] = show
            # Add topics
            show.topics.add(topics["central-banks"], topics["fintech"])
            show.industries.add(industries["banking"])
            status = "Created" if created else "Updated"
            self.stdout.write(f"  {status} show: {show.name}")

        # Create Podcast Episodes
        episodes_data = [
            # African Markets Today episodes
            {
                "show": "african-markets-today",
                "title": "JSE Rally Continues Amid Global Uncertainty",
                "slug": "jse-rally-continues-global-uncertainty",
                "episode_number": 245,
                "description": "The Johannesburg Stock Exchange extended its winning streak as mining stocks led gains. We analyze the drivers behind the rally and what it means for investors.",
                "summary": "Mining stocks lead JSE gains as global investors seek African exposure",
                "show_notes": "00:00 - Market Open\n05:30 - Mining Sector Analysis\n12:00 - Banking Updates\n18:30 - Currency Watch\n25:00 - Week Ahead",
                "duration_seconds": 1965,
                "status": "published",
                "is_featured": True,
                "listen_count": 1234,
                "guests": [{"name": "Dr. Sarah Okonkwo", "title": "Chief Economist", "organization": "First National Bank"}],
            },
            {
                "show": "african-markets-today",
                "title": "Nigerian Banks Q4 Results Preview",
                "slug": "nigerian-banks-q4-results-preview",
                "episode_number": 244,
                "description": "What to expect from Nigerian bank earnings this quarter. We preview results from Zenith, GTBank, and Access Bank.",
                "summary": "Previewing Nigerian bank earnings season",
                "show_notes": "00:00 - Introduction\n03:00 - Zenith Bank Preview\n10:00 - GTBank Analysis\n17:00 - Access Bank Outlook\n24:00 - Sector Summary",
                "duration_seconds": 1692,
                "status": "published",
                "is_featured": False,
                "listen_count": 987,
                "guests": [],
            },
            {
                "show": "african-markets-today",
                "title": "SARB Rate Decision Analysis",
                "slug": "sarb-rate-decision-analysis",
                "episode_number": 243,
                "description": "Breaking down the South African Reserve Bank's latest interest rate decision and its implications for the rand and local markets.",
                "summary": "Analysis of SARB monetary policy decision",
                "duration_seconds": 2145,
                "status": "published",
                "is_featured": False,
                "listen_count": 856,
                "guests": [{"name": "Prof. James Mwangi", "title": "Economics Professor", "organization": "University of Cape Town"}],
            },
            # Research Briefing episodes
            {
                "show": "research-briefing",
                "title": "Central Bank Digital Currencies in Africa",
                "slug": "cbdc-africa-deep-dive",
                "episode_number": 89,
                "description": "Our fintech research team discusses the state of CBDC development across Africa, including Nigeria's eNaira and upcoming projects in Ghana, Kenya, and South Africa.",
                "summary": "Deep dive into African CBDC initiatives",
                "show_notes": "00:00 - CBDC Overview\n08:00 - eNaira Update\n20:00 - Ghana's Digital Cedi\n32:00 - Regional Implications\n42:00 - Future Outlook",
                "duration_seconds": 2730,
                "status": "published",
                "is_featured": True,
                "listen_count": 756,
                "guests": [{"name": "Amara Obi", "title": "Fintech Research Lead", "organization": "Bard Global Financial Institute"}],
            },
            {
                "show": "research-briefing",
                "title": "AfCFTA One Year On: Trade Impacts",
                "slug": "afcfta-one-year-trade-impacts",
                "episode_number": 88,
                "description": "Examining the African Continental Free Trade Area one year after implementation began. What's working, what's not, and what comes next.",
                "summary": "Assessing AfCFTA implementation progress",
                "duration_seconds": 2325,
                "status": "published",
                "is_featured": False,
                "listen_count": 623,
                "guests": [],
            },
            # Executive Conversations episodes
            {
                "show": "executive-conversations",
                "title": "Mining Sector Outlook with Anglo American CEO",
                "slug": "anglo-american-ceo-interview",
                "episode_number": 34,
                "description": "An exclusive interview discussing the future of mining in Africa, sustainability initiatives, and the energy transition.",
                "summary": "Exclusive interview on African mining's future",
                "duration_seconds": 3138,
                "status": "published",
                "is_featured": True,
                "listen_count": 1432,
                "guests": [{"name": "Duncan Wanblad", "title": "CEO", "organization": "Anglo American"}],
            },
            {
                "show": "executive-conversations",
                "title": "Building Africa's Leading Digital Bank",
                "slug": "building-africas-digital-bank",
                "episode_number": 33,
                "description": "The founder of one of Africa's fastest-growing digital banks shares insights on scaling fintech across borders.",
                "summary": "Fintech founder on scaling across Africa",
                "duration_seconds": 2856,
                "status": "published",
                "is_featured": False,
                "listen_count": 892,
                "guests": [{"name": "Tunde Kehinde", "title": "Co-founder & CEO", "organization": "Lidya"}],
            },
        ]

        for idx, e in enumerate(episodes_data):
            show = shows[e.pop("show")]
            published_at = timezone.now() - timedelta(days=idx * 3)
            episode, created = PodcastEpisode.objects.update_or_create(
                show=show,
                slug=e["slug"],
                defaults={
                    **e,
                    "published_at": published_at,
                }
            )
            # Add topics
            episode.topics.add(topics["central-banks"], topics["fintech"])
            status = "Created" if created else "Updated"
            self.stdout.write(f"  {status} episode: {episode.title}")

        self.stdout.write(self.style.SUCCESS("Successfully seeded research and podcast data!"))
