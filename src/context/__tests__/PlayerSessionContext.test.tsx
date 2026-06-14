import { render, screen, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { PlayerSessionProvider, usePlayerSession } from "../PlayerSessionContext";
import { fetchPlayerByUsername, updatePlayerGold } from "../../utils/players";

// Mock Supabase
vi.mock("../../utils/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    }
  }
}));

// Mock Players utility
vi.mock("../../utils/players", () => ({
  fetchPlayerByUsername: vi.fn(),
  updatePlayerGold: vi.fn(),
  touchPlayerActivity: vi.fn(),
  linkPlayerToAuthUser: vi.fn(),
  isPlayerLinkedToAuthUser: vi.fn(),
}));

// Test component to consume context
function TestConsumer() {
  const session = usePlayerSession();

  return (
    <div>
      <div data-testid="is-hydrating">{session.isHydrating.toString()}</div>
      <div data-testid="player-username">{session.player?.username || "no-player"}</div>
      <div data-testid="player-gold">{session.player?.gold ?? "no-gold"}</div>
      <div data-testid="profile-error">{session.profileError || "no-error"}</div>

      <button
        data-testid="connect-btn"
        onClick={() => session.connectPlayer("TestPlayer")}
      >
        Connect
      </button>

      <button
        data-testid="connect-empty-btn"
        onClick={() => session.connectPlayer("   ")}
      >
        Connect Empty
      </button>

      <button
        data-testid="clear-btn"
        onClick={() => session.clearPlayer()}
      >
        Clear
      </button>

      <button
        data-testid="update-gold-btn"
        onClick={() => session.setPlayerGold(100)}
      >
        Update Gold
      </button>
    </div>
  );
}

describe("PlayerSessionContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("throws error if usePlayerSession is used outside provider", () => {
    // Suppress console.error for this expected error
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow("usePlayerSession debe usarse dentro de PlayerSessionProvider");

    consoleSpy.mockRestore();
  });

  it("initializes and resolves hydration", async () => {
    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-hydrating").textContent).toBe("false");
    });
    expect(screen.getByTestId("player-username").textContent).toBe("no-player");
  });

  it("hydrates player from localStorage if present", async () => {
    const mockPlayer = { id: "1", username: "StoredPlayer", gold: 50 };
    vi.mocked(fetchPlayerByUsername).mockResolvedValueOnce(mockPlayer as any);
    window.localStorage.setItem("kingdoom.active-player", "StoredPlayer");

    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-hydrating").textContent).toBe("false");
    });

    expect(screen.getByTestId("player-username").textContent).toBe("StoredPlayer");
    expect(screen.getByTestId("player-gold").textContent).toBe("50");
  });

  it("connects player successfully", async () => {
    const mockPlayer = { id: "2", username: "TestPlayer", gold: 10 };
    vi.mocked(fetchPlayerByUsername).mockResolvedValueOnce(mockPlayer as any);

    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-hydrating").textContent).toBe("false");
    });

    await act(async () => {
      screen.getByTestId("connect-btn").click();
    });

    expect(vi.mocked(fetchPlayerByUsername)).toHaveBeenCalledWith("TestPlayer");
    expect(screen.getByTestId("player-username").textContent).toBe("TestPlayer");
    expect(screen.getByTestId("player-gold").textContent).toBe("10");
    expect(window.localStorage.getItem("kingdoom.active-player")).toBe("TestPlayer");
  });

  it("shows error when connecting with empty username", async () => {
    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await act(async () => {
      screen.getByTestId("connect-empty-btn").click();
    });

    expect(screen.getByTestId("profile-error").textContent).toBe("Escribe tu nombre de jugador para conectar el perfil.");
    expect(vi.mocked(fetchPlayerByUsername)).not.toHaveBeenCalled();
  });

  it("shows error when player is not found", async () => {
    vi.mocked(fetchPlayerByUsername).mockResolvedValueOnce(null);

    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await act(async () => {
      screen.getByTestId("connect-btn").click();
    });

    expect(screen.getByTestId("profile-error").textContent).toBe("Jugador no encontrado. Verifica el nombre exacto registrado en la base de datos.");
    expect(screen.getByTestId("player-username").textContent).toBe("no-player");
  });

  it("clears player correctly", async () => {
    const mockPlayer = { id: "3", username: "TestPlayer", gold: 10 };
    vi.mocked(fetchPlayerByUsername).mockResolvedValueOnce(mockPlayer as any);

    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await act(async () => {
      screen.getByTestId("connect-btn").click();
    });

    expect(screen.getByTestId("player-username").textContent).toBe("TestPlayer");

    await act(async () => {
      screen.getByTestId("clear-btn").click();
    });

    expect(screen.getByTestId("player-username").textContent).toBe("no-player");
    expect(window.localStorage.getItem("kingdoom.active-player")).toBeNull();
  });

  it("updates player gold optimistically and persists", async () => {
    const mockPlayer = { id: "4", username: "TestPlayer", gold: 10 };
    vi.mocked(fetchPlayerByUsername).mockResolvedValueOnce(mockPlayer as any);
    vi.mocked(updatePlayerGold).mockResolvedValueOnce(true);

    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await act(async () => {
      screen.getByTestId("connect-btn").click();
    });

    expect(screen.getByTestId("player-gold").textContent).toBe("10");

    await act(async () => {
      screen.getByTestId("update-gold-btn").click();
    });

    expect(vi.mocked(updatePlayerGold)).toHaveBeenCalledWith("4", 100);
    expect(screen.getByTestId("player-gold").textContent).toBe("100");
  });

  it("rolls back gold if update fails", async () => {
    const mockPlayer = { id: "5", username: "TestPlayer", gold: 10 };
    vi.mocked(fetchPlayerByUsername).mockResolvedValueOnce(mockPlayer as any);
    vi.mocked(updatePlayerGold).mockResolvedValueOnce(false); // Simulate failure

    render(
      <PlayerSessionProvider>
        <TestConsumer />
      </PlayerSessionProvider>
    );

    await act(async () => {
      screen.getByTestId("connect-btn").click();
    });

    expect(screen.getByTestId("player-gold").textContent).toBe("10");

    await act(async () => {
      screen.getByTestId("update-gold-btn").click();
    });

    // It should rollback to original value
    expect(screen.getByTestId("player-gold").textContent).toBe("10");
    expect(screen.getByTestId("profile-error").textContent).toBe("No se pudo actualizar el oro del jugador. Intenta refrescar el perfil.");
  });
});
