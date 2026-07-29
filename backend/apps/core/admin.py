from django.contrib import admin

from .models import PartnerApiKey


@admin.register(PartnerApiKey)
class PartnerApiKeyAdmin(admin.ModelAdmin):
    list_display = ["name", "key", "is_active", "request_count", "last_used_at", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "key"]
    readonly_fields = ["key", "request_count", "last_used_at", "created_at", "updated_at"]
