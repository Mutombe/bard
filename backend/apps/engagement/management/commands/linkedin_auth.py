"""
LinkedIn OAuth Setup Command

Run once to authorize BGFI to post to LinkedIn:
    python manage.py linkedin_auth

This will:
1. Print an authorization URL — open it in your browser
2. After authorizing, LinkedIn redirects with a code
3. Paste the code back here
4. Access token is saved for auto-posting
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Set up LinkedIn OAuth for auto-posting featured articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--code",
            type=str,
            help="Authorization code from LinkedIn redirect URL",
        )
        parser.add_argument(
            "--token",
            type=str,
            help="Manually set an access token (skip OAuth flow)",
        )

    def handle(self, *args, **options):
        from apps.engagement.linkedin import LinkedInService

        service = LinkedInService()

        if not service.is_configured:
            self.stdout.write(self.style.ERROR(
                "LinkedIn not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env vars."
            ))
            return

        # Manual token setting
        if options.get("token"):
            service.set_access_token(options["token"])
            self.stdout.write(self.style.SUCCESS("Access token saved."))
            return

        # Exchange code for token
        if options.get("code"):
            token = service.exchange_code_for_token(options["code"])
            if token:
                self.stdout.write(self.style.SUCCESS("Access token obtained and saved."))
                profile = service.get_user_profile(token)
                if profile:
                    self.stdout.write(f"Authenticated as: {profile.get('name', 'Unknown')}")
            else:
                self.stdout.write(self.style.ERROR("Failed to exchange code for token."))
            return

        # Show auth URL
        auth_url = service.get_auth_url()
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("LINKEDIN OAUTH SETUP")
        self.stdout.write("=" * 60)
        self.stdout.write("\n1. Open this URL in your browser:\n")
        self.stdout.write(self.style.SUCCESS(auth_url))
        self.stdout.write("\n2. Authorize BGFI to post on your behalf")
        self.stdout.write("3. Copy the 'code' parameter from the redirect URL")
        self.stdout.write("4. Run: python manage.py linkedin_auth --code YOUR_CODE\n")
