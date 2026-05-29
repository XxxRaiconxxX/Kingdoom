import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import {
  fetchPlayerNotificationsNative,
  markPlayerNotificationsReadNative,
  type PlayerNotification,
} from "../features/notifications/notificationsService";
import { MOBILE_THEME } from "../theme/colors";

function NotificationItem({ notification }: { notification: PlayerNotification }) {
  const icon = notification.kind === "gold" ? "coins" : "gift";
  const tone = notification.kind === "gold" ? MOBILE_THEME.gold : MOBILE_THEME.teal;
  const bg = notification.kind === "gold" ? "rgba(240,179,47,0.1)" : "rgba(49,209,179,0.1)";

  const dateStr = new Date(notification.createdAt);
  const timeString = Number.isNaN(dateStr.getTime())
    ? "Ahora"
    : dateStr.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" });

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: notification.isRead ? MOBILE_THEME.border : "rgba(240,179,47,0.3)",
        backgroundColor: notification.isRead ? "rgba(17,16,13,0.6)" : "rgba(240,179,47,0.08)",
        padding: 12,
        flexDirection: "row",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: tone,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        <FontAwesome5 name={icon} size={14} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Text style={{ color: MOBILE_THEME.text, fontSize: 13, fontWeight: "900", flex: 1 }}>
            {notification.title}
          </Text>
          {!notification.isRead ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: MOBILE_THEME.gold,
                marginTop: 4,
              }}
            />
          ) : null}
        </View>
        <Text style={{ color: MOBILE_THEME.dimText, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
          {notification.message}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              color: MOBILE_THEME.mutedText,
              fontSize: 10,
              fontWeight: "900",
              textTransform: "uppercase",
            }}
          >
            {notification.senderName}
          </Text>
          <Text style={{ color: MOBILE_THEME.border, fontSize: 10 }}>|</Text>
          <Text
            style={{
              color: MOBILE_THEME.mutedText,
              fontSize: 10,
              fontWeight: "900",
              textTransform: "uppercase",
            }}
          >
            {timeString}
          </Text>
          {notification.kind === "item" && notification.itemName ? (
            <>
              <Text style={{ color: MOBILE_THEME.border, fontSize: 10 }}>|</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <FontAwesome5 name="gift" size={10} color={MOBILE_THEME.teal} />
                <Text
                  style={{
                    color: MOBILE_THEME.teal,
                    fontSize: 10,
                    fontWeight: "900",
                    textTransform: "uppercase",
                  }}
                >
                  {notification.itemName}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function PlayerNotificationBellNative({ playerId }: { playerId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["player-notifications", playerId];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPlayerNotificationsNative(playerId),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => markPlayerNotificationsReadNative(playerId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PlayerNotification[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<PlayerNotification[]>(
          queryKey,
          previous.map((notification) => ({ ...notification, isRead: true }))
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleToggle = useCallback(() => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen && unreadCount > 0) {
      markReadMutation.mutate();
    }
  }, [isOpen, markReadMutation, unreadCount]);

  return (
    <>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => ({
          width: 46,
          height: 46,
          borderRadius: 23,
          borderWidth: 1,
          borderColor: unreadCount > 0 ? "rgba(240,179,47,0.4)" : MOBILE_THEME.border,
          backgroundColor: pressed ? "rgba(240,179,47,0.12)" : "rgba(17,16,13,0.86)",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <MaterialIcons
          name="notifications"
          size={22}
          color={unreadCount > 0 ? MOBILE_THEME.gold : MOBILE_THEME.mutedText}
        />
        {unreadCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: MOBILE_THEME.danger,
              borderWidth: 2,
              borderColor: "rgba(17,16,13,0.9)",
            }}
          />
        ) : null}
      </Pressable>

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={() => setIsOpen(false)}>
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(180)}
            exiting={SlideOutDown.duration(200)}
            style={{
              backgroundColor: MOBILE_THEME.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderColor: MOBILE_THEME.border,
              padding: 20,
              paddingBottom: 40,
              maxHeight: "80%",
              minHeight: "50%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View>
                <Text
                  style={{
                    color: MOBILE_THEME.gold,
                    fontSize: 10,
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                  }}
                >
                  Avisos del reino
                </Text>
                <Text style={{ color: MOBILE_THEME.text, fontSize: 20, fontWeight: "900", marginTop: 2 }}>
                  Notificaciones
                </Text>
              </View>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="close" size={20} color={MOBILE_THEME.text} />
              </Pressable>
            </View>

            {isLoading && notifications.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={MOBILE_THEME.gold} />
                <Text style={{ color: MOBILE_THEME.dimText, fontSize: 13, marginTop: 12 }}>
                  Consultando avisos...
                </Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <MaterialIcons name="notifications-none" size={40} color={MOBILE_THEME.border} />
                <Text style={{ color: MOBILE_THEME.dimText, fontSize: 13, marginTop: 12 }}>
                  Sin avisos recientes.
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              >
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
