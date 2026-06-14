import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HomeSection } from "../HomeSection";
import * as eventsUtils from "../../utils/events";
import * as siteSettingsUtils from "../../utils/siteSettings";
import { ACTIVE_EVENTS } from "../../data/events";

// Mock the dependencies
vi.mock("../../utils/events", () => ({
  fetchRealmEvents: vi.fn(),
}));

vi.mock("../../utils/siteSettings", () => ({
  fetchCommunityAppDownloadUrl: vi.fn(),
}));

describe("HomeSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    vi.mocked(eventsUtils.fetchRealmEvents).mockResolvedValue({
      status: "ready",
      events: ACTIVE_EVENTS,
      message: ""
    });

    vi.mocked(siteSettingsUtils.fetchCommunityAppDownloadUrl).mockResolvedValue(
      "https://example.com/app.apk"
    );
  });

  it("renders correctly with default state", async () => {
    render(<HomeSection />);

    // Verify main title
    expect(screen.getByText("Reino de las Sombras")).toBeInTheDocument();

    // Verify sections exist
    expect(screen.getByText("La noche se mueve")).toBeInTheDocument();

    // Wait for the async effects to resolve
    await waitFor(() => {
      expect(eventsUtils.fetchRealmEvents).toHaveBeenCalledTimes(1);
    });
  });

  it("displays community app download link when URL is available", async () => {
    render(<HomeSection />);

    await waitFor(() => {
      const link = screen.getByText("Descargar app de la comunidad");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "https://example.com/app.apk");
    });
  });

  it("displays fallback UI when download URL is empty", async () => {
    vi.mocked(siteSettingsUtils.fetchCommunityAppDownloadUrl).mockResolvedValue("");

    render(<HomeSection />);

    await waitFor(() => {
      expect(screen.getByText("Configura el enlace de descarga cuando el APK este listo")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /descargar app/i })).not.toBeInTheDocument();
    });
  });

  it("updates events from the API", async () => {
    const customEvents = [
      {
        title: "Custom Event Test",
        description: "Test description",
        longDescription: "Long description",
        imageUrl: "",
        startDate: "pendiente",
        endDate: "pendiente",
        status: "in-production",
        factions: [],
        rewards: "",
        requirements: ""
      }
    ];

    vi.mocked(eventsUtils.fetchRealmEvents).mockResolvedValue({
      status: "ready",
      events: customEvents as any,
      message: ""
    });

    render(<HomeSection />);

    await waitFor(() => {
      expect(screen.getByText("Custom Event Test")).toBeInTheDocument();
    });
  });
});
