"""
News Admin Configuration
"""
from django.contrib import admin

from .models import Category, NewsArticle, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "parent", "is_active", "order"]
    list_filter = ["is_active", "parent"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "category",
        "author",
        "status",
        "content_type",
        "is_featured",
        "is_premium",
        "published_at",
    ]
    list_filter = ["status", "category", "content_type", "is_featured", "is_premium"]
    search_fields = ["title", "excerpt", "content"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_at"
    filter_horizontal = ["tags", "related_companies"]
    readonly_fields = ["view_count", "read_time_minutes"]

    fieldsets = (
        (None, {"fields": ("title", "slug", "subtitle", "excerpt")}),
        ("Content", {"fields": ("content", "featured_image", "featured_image_caption")}),
        (
            "Classification",
            {"fields": ("category", "tags", "content_type", "related_companies")},
        ),
        (
            "Publishing",
            {
                "fields": (
                    "author",
                    "editor",
                    "status",
                    "published_at",
                    "is_featured",
                    "is_breaking",
                    "is_premium",
                )
            },
        ),
        ("Analytics", {"fields": ("view_count", "read_time_minutes")}),
        ("SEO", {"fields": ("meta_title", "meta_description")}),
    )

    def save_model(self, request, obj, form, change):
        if not obj.author:
            obj.author = request.user
        super().save_model(request, obj, form, change)
