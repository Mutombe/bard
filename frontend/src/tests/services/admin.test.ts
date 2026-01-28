import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "@/services/api/admin";
import { authClient } from "@/services/api/client";

// Mock the authClient
vi.mock("@/services/api/client", () => ({
  authClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Admin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should fetch users with pagination", async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, email: "user1@example.com", role: "subscriber" },
            { id: 2, email: "user2@example.com", role: "editor" },
          ],
          count: 2,
          next: null,
          previous: null,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await adminService.getUsers();

      expect(authClient.get).toHaveBeenCalledWith("/users/", { params: undefined });
      expect(result.results).toHaveLength(2);
    });

    it("should filter users by role", async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, email: "editor@example.com", role: "editor" }],
          count: 1,
        },
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await adminService.getUsers({ role: "editor" });

      expect(authClient.get).toHaveBeenCalledWith("/users/", {
        params: { role: "editor" },
      });
    });

    it("should return empty results on error", async () => {
      (authClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Not found"));

      const result = await adminService.getUsers();

      expect(result.results).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });

  describe("getUser", () => {
    it("should fetch single user by ID", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        role: "subscriber",
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser });

      const result = await adminService.getUser(1);

      expect(authClient.get).toHaveBeenCalledWith("/users/1/");
      expect(result.email).toBe("test@example.com");
    });
  });

  describe("updateUser", () => {
    it("should update user", async () => {
      const updateData = {
        first_name: "Updated",
        role: "editor" as const,
      };

      const mockResponse = { data: { id: 1, ...updateData } };
      (authClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await adminService.updateUser(1, updateData);

      expect(authClient.patch).toHaveBeenCalledWith("/users/1/", updateData);
      expect(result.first_name).toBe("Updated");
    });
  });

  describe("deleteUser", () => {
    it("should delete user", async () => {
      (authClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await adminService.deleteUser(1);

      expect(authClient.delete).toHaveBeenCalledWith("/users/1/");
    });
  });

  describe("getUserStats", () => {
    it("should fetch user statistics", async () => {
      const mockStats = {
        total_users: 1000,
        premium_users: 150,
        admin_count: 5,
        new_today: 25,
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockStats });

      const result = await adminService.getUserStats();

      expect(authClient.get).toHaveBeenCalledWith("/users/stats/");
      expect(result.total_users).toBe(1000);
      expect(result.premium_users).toBe(150);
    });

    it("should return zero stats on error", async () => {
      (authClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Error"));

      const result = await adminService.getUserStats();

      expect(result.total_users).toBe(0);
      expect(result.premium_users).toBe(0);
    });
  });

  describe("bulkUserAction", () => {
    it("should activate users", async () => {
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await adminService.bulkUserAction("activate", [1, 2, 3]);

      expect(authClient.post).toHaveBeenCalledWith("/users/bulk-action/", {
        action: "activate",
        user_ids: [1, 2, 3],
      });
    });

    it("should deactivate users", async () => {
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await adminService.bulkUserAction("deactivate", [4, 5]);

      expect(authClient.post).toHaveBeenCalledWith("/users/bulk-action/", {
        action: "deactivate",
        user_ids: [4, 5],
      });
    });

    it("should delete users", async () => {
      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await adminService.bulkUserAction("delete", [6]);

      expect(authClient.post).toHaveBeenCalledWith("/users/bulk-action/", {
        action: "delete",
        user_ids: [6],
      });
    });
  });

  describe("getNewsletterStats", () => {
    it("should fetch newsletter statistics", async () => {
      const mockStats = {
        total_subscribers: 5000,
        active_subscribers: 4500,
        open_rate: 25.5,
        click_rate: 8.2,
      };

      (authClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockStats });

      const result = await adminService.getNewsletterStats();

      expect(authClient.get).toHaveBeenCalledWith("/engagement/newsletters/stats/");
      expect(result.total_subscribers).toBe(5000);
      expect(result.open_rate).toBe(25.5);
    });

    it("should return zero stats on error", async () => {
      (authClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Error"));

      const result = await adminService.getNewsletterStats();

      expect(result.total_subscribers).toBe(0);
      expect(result.active_subscribers).toBe(0);
    });
  });

  describe("createNewsletter", () => {
    it("should send newsletter", async () => {
      const newsletterData = {
        subject: "Weekly Update",
        content: "Newsletter content here",
        subscription_types: ["morning_brief", "weekly_digest"],
      };

      const mockResponse = {
        data: {
          status: "sent",
          emails_sent: 1500,
          total_subscribers: 1500,
        },
      };

      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await adminService.createNewsletter(newsletterData);

      expect(authClient.post).toHaveBeenCalledWith("/engagement/newsletters/send/", newsletterData);
      expect(result.emails_sent).toBe(1500);
    });

    it("should schedule newsletter", async () => {
      const newsletterData = {
        subject: "Scheduled Newsletter",
        content: "Content",
        subscription_types: ["morning_brief"],
        scheduled_for: "2024-02-01T08:00:00Z",
      };

      const mockResponse = {
        data: {
          status: "scheduled",
          emails_sent: 0,
          total_subscribers: 2000,
        },
      };

      (authClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await adminService.createNewsletter(newsletterData);

      expect(result.status).toBe("scheduled");
    });
  });
});
