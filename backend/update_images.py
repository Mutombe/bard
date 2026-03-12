#!/usr/bin/env python
"""Re-update ALL images with shorter, better Unsplash queries. Featured first."""
import os, hashlib
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
import django; django.setup()

from apps.news.models import NewsArticle
from apps.media.image_service import ArticleImageService

def main():
    svc = ArticleImageService()
    unsplash = svc.unsplash
    print(f'API keys: {len(unsplash.api_keys)}')

    # ALL published, featured + latest FIRST
    articles = list(
        NewsArticle.objects.filter(status='published')
        .order_by('-is_featured', '-published_at')
    )
    print(f'Total: {len(articles)}')

    # Show what queries will be generated
    print('\nSample queries (new short format):')
    for a in articles[:10]:
        cat = a.category.slug if a.category else ''
        q = svc._build_search_query(a.title, a.excerpt or '', cat, '')
        feat = ' *FEAT*' if a.is_featured else ''
        print(f'  "{q}" <- {a.title[:45]}{feat}')

    # Group and batch
    groups = {}
    for a in articles:
        cat = a.category.slug if a.category else ''
        q = svc._build_search_query(a.title, a.excerpt or '', cat, '')
        groups.setdefault(q, []).append(a)

    print(f'\nUnique queries: {len(groups)}')
    saved = 0
    api_calls = 0

    for query, arts in groups.items():
        result = unsplash.search_photo(query, per_page=10, use_cache=False)
        api_calls += 1
        photos = (result or {}).get('all_results', [])

        if not photos:
            cat = arts[0].category.slug if arts[0].category else ''
            fb = svc.CATEGORY_QUERIES.get(cat, 'business')
            if fb != query:
                result = unsplash.search_photo(fb, per_page=10, use_cache=False)
                api_calls += 1
                photos = (result or {}).get('all_results', [])

        if not photos:
            print(f'  FAIL: "{query}" ({len(arts)} articles)')
            continue

        for a in arts:
            seed = int(hashlib.md5(str(a.id).encode()).hexdigest()[:8], 16)
            url = photos[seed % len(photos)].get('url')
            if url:
                a.featured_image_url = url
                a.save(update_fields=['featured_image_url'])
                saved += 1

    print(f'\nDone: {saved}/{len(articles)} updated, {api_calls} API calls')

    # Verify top 10
    print('\nTop 10:')
    for i, a in enumerate(NewsArticle.objects.filter(status='published').order_by('-is_featured', '-published_at')[:10], 1):
        has = 'ixid=' in (a.featured_image_url or '')
        feat = ' *FEATURED*' if a.is_featured else ''
        print(f'  {i}. [{"OK" if has else "!!"}] {a.title[:55]}{feat}')

if __name__ == '__main__':
    main()
