import { describe, it, expect, vi, beforeEach } from "vitest";
import { editorialService } from "@/services/api/editorial";
import { authClient } from "@/services/api/client";

// Mock the authClient
vi.mock("@/services/api/client", () => ({
  authClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Editorial Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getArticles", () => {
    it("should fetch articles with pagination", async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: "Article 1", slug: "article-1" },
            { id: 2, title: "Article 2", slug: "article-2" },
          ],
          count: 2,
          next: null,
          previous: null,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await editorialService.getArticles({ page: 1, page_size: 10 });

      expect(authClient.get).toHaveBeenCalledWith("/news/articles/", {
        params: { page: 1, page_size: 10 },
      });
      expect(result.results).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it("should filter articles by status", async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, title: "Draft Article", status: "draft" }],
          count: 1,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await editorialService.getArticles({ status: "draft" });

      expect(authClient.get).toHaveBeenCalledWith("/news/articles/", {
        params: { status: "draft" },
      });
    });

    it("should filter articles by content_type", async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, title: "Opinion", content_type: "opinion" }],
          count: 1,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await editorialService.getArticles({ content_type: "opinion" });

      expect(authClient.get).toHaveBeenCalledWith("/news/articles/", {
        params: { content_type: "opinion" },
      });
    });
  });

  describe("getArticle", () => {
    it("should fetch single article by ID", async () => {
      const mockArticle = {
        id: 1,
        title: "Test Article",
        slug: "test-article",
        content: "Content here",
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockArticle });

      const result = await editorialService.getArticle("1");

      expect(authClient.get).toHaveBeenCalledWith("/news/articles/1/");
      expect(result.title).toBe("Test Article");
    });
  });

  describe("createArticle", () => {
    it("should create article with all fields", async () => {
      const articleData = {
        title: "New Article",
        content: "Article content",
        category: "markets",
        content_type: "news",
        tags: ["jse", "markets"],
        status: "draft",
      };

      const mockResponse = { data: { id: 1, ...articleData } };
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await editorialService.createArticle(articleData);

      expect(authClient.post).toHaveBeenCalledWith("/news/articles/", articleData);
      expect(result.title).toBe("New Article");
    });

    it("should create and publish article", async () => {
      const articleData = {
        title: "Published Article",
        content: "Content",
        category: "markets",
        status: "published",
      };

      const mockResponse = { data: { id: 1, ...articleData, published_at: "2024-01-01" } };
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await editorialService.createArticle(articleData);

      expect(result.status).toBe("published");
    });
  });

  describe("updateArticle", () => {
    it("should update article", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
      };

      const mockResponse = { data: { id: 1, slug: "test-article", ...updateData } };
      (authClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await editorialService.updateArticle("test-article", updateData);

      expect(authClient.patch).toHaveBeenCalledWith("/news/articles/test-article/", updateData);
      expect(result.title).toBe("Updated Title");
    });

    it("should update article tags", async () => {
      const updateData = {
        tags: ["new-tag-1", "new-tag-2"],
      };

      const mockResponse = { data: { id: 1, ...updateData } };
      (authClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await editorialService.updateArticle("test-article", updateData);

      expect(authClient.patch).toHaveBeenCalledWith("/news/articles/test-article/", updateData);
    });
  });

  describe("deleteArticle", () => {
    it("should delete article", async () => {
      (authClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await editorialService.deleteArticle("test-article");

      expect(authClient.delete).toHaveBeenCalledWith("/news/articles/test-article/");
    });
  });

  describe("bulkAction", () => {
    it("should perform bulk publish", async () => {
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, affected: 3 },
      });

      await editorialService.bulkAction("publish", [1, 2, 3]);

      expect(authClient.post).toHaveBeenCalledWith("/editorial/bulk-action/", {
        action: "publish",
        article_ids: [1, 2, 3],
      });
    });

    it("should perform bulk delete", async () => {
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, affected: 2 },
      });

      await editorialService.bulkAction("delete", [1, 2]);

      expect(authClient.post).toHaveBeenCalledWith("/editorial/bulk-action/", {
        action: "delete",
        article_ids: [1, 2],
      });
    });
  });
});
