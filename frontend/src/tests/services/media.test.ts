import { describe, it, expect, vi, beforeEach } from "vitest";
import { mediaService } from "@/services/api/media";
import { authClient } from "@/services/api/client";

// Mock the authClient
vi.mock("@/services/api/client", () => ({
  authClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Media Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFiles", () => {
    it("should fetch all files", async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, name: "image1.jpg", file_type: "image" },
            { id: 2, name: "doc.pdf", file_type: "document" },
          ],
          count: 2,
          next: null,
          previous: null,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await mediaService.getFiles();

      expect(authClient.get).toHaveBeenCalledWith("/media/library/", { params: undefined });
      expect(result.results).toHaveLength(2);
    });

    it("should filter files by type", async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, name: "image.jpg", file_type: "image" }],
          count: 1,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await mediaService.getFiles({ file_type: "image" });

      expect(authClient.get).toHaveBeenCalledWith("/media/library/", {
        params: { file_type: "image" },
      });
    });

    it("should search files", async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, name: "annual_report.pdf" }],
          count: 1,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await mediaService.getFiles({ search: "annual" });

      expect(authClient.get).toHaveBeenCalledWith("/media/library/", {
        params: { search: "annual" },
      });
    });

    it("should return empty results on error", async () => {
      (authClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const result = await mediaService.getFiles();

      expect(result.results).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });

  describe("getFile", () => {
    it("should fetch single file by ID", async () => {
      const mockFile = {
        id: 1,
        name: "test.jpg",
        file_type: "image",
        url: "/uploads/test.jpg",
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockFile });

      const result = await mediaService.getFile(1);

      expect(authClient.get).toHaveBeenCalledWith("/media/library/1/");
      expect(result.name).toBe("test.jpg");
    });
  });

  describe("uploadFile", () => {
    it("should upload file", async () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });
      const mockResponse = {
        data: {
          id: 1,
          name: "test.txt",
          file_type: "document",
          size: 12,
        },
      };

      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await mediaService.uploadFile(file);

      expect(authClient.post).toHaveBeenCalled();
      const [url, formData, config] = (authClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/media/library/");
      expect(formData).toBeInstanceOf(FormData);
      expect(config.headers["Content-Type"]).toBe("multipart/form-data");
      expect(result.name).toBe("test.txt");
    });

    it("should upload file with metadata", async () => {
      const file = new File(["test"], "image.jpg", { type: "image/jpeg" });
      const metadata = {
        name: "Custom Name",
        alt_text: "Alt text",
        caption: "Caption",
      };

      const mockResponse = {
        data: {
          id: 1,
          name: "Custom Name",
          alt_text: "Alt text",
          caption: "Caption",
        },
      };

      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await mediaService.uploadFile(file, metadata);

      const formData = (authClient.post as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(formData.get("name")).toBe("Custom Name");
      expect(formData.get("alt_text")).toBe("Alt text");
      expect(result.alt_text).toBe("Alt text");
    });
  });

  describe("deleteFile", () => {
    it("should delete file", async () => {
      (authClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await mediaService.deleteFile(1);

      expect(authClient.delete).toHaveBeenCalledWith("/media/library/1/");
    });
  });

  describe("bulkDelete", () => {
    it("should delete multiple files", async () => {
      const mockResponse = {
        data: {
          message: "Deleted 3 files",
          deleted_count: 3,
        },
      };

      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await mediaService.bulkDelete([1, 2, 3]);

      expect(authClient.post).toHaveBeenCalledWith("/media/library/bulk_delete/", {
        ids: [1, 2, 3],
      });
      expect(result.deleted_count).toBe(3);
    });
  });

  describe("getStats", () => {
    it("should fetch library statistics", async () => {
      const mockStats = {
        total_files: 100,
        total_size: 1024000,
        total_size_display: "1.0 MB",
        by_type: {
          image: 80,
          document: 15,
          video: 5,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockStats });

      const result = await mediaService.getStats();

      expect(authClient.get).toHaveBeenCalledWith("/media/library/stats/");
      expect(result.total_files).toBe(100);
      expect(result.by_type.image).toBe(80);
    });

    it("should return empty stats on error", async () => {
      (authClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const result = await mediaService.getStats();

      expect(result.total_files).toBe(0);
      expect(result.total_size).toBe(0);
    });
  });

  describe("getDownloadUrl", () => {
    it("should return correct download URL", () => {
      const url = mediaService.getDownloadUrl(123);
      expect(url).toBe("/api/media/library/123/download/");
    });
  });
});
