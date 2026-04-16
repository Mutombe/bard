"""Data migration: convert existing market_update content_type to insights."""
from django.db import migrations


def market_update_to_insights(apps, schema_editor):
    NewsArticle = apps.get_model("news", "NewsArticle")
    NewsArticle.objects.filter(content_type="market_update").update(content_type="insights")


def insights_to_market_update(apps, schema_editor):
    NewsArticle = apps.get_model("news", "NewsArticle")
    NewsArticle.objects.filter(content_type="insights").update(content_type="market_update")


class Migration(migrations.Migration):

    dependencies = [
        ("news", "0007_alter_newsarticle_content_type"),
    ]

    operations = [
        migrations.RunPython(market_update_to_insights, insights_to_market_update),
    ]
