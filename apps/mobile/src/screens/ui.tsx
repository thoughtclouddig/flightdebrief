import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { c, s } from "../theme";

/** 52pt, well over the 44pt minimum — this gets tapped on a ramp, in gloves. */
export function PrimaryButton({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [st.primary, pressed && st.pressed]}>
      {busy ? <ActivityIndicator color={c.onBrand} /> : <Text style={st.primaryLabel}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.secondary, pressed && st.pressed]}>
      <Text style={st.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[st.panel, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={st.title}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={st.label}>{children}</Text>;
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.row}>
      <Text style={st.rowLabel}>{label}</Text>
      <Text style={st.rowValue}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  primary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: c.brand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s.lg,
  },
  primaryLabel: { color: c.onBrand, fontSize: 17, fontWeight: "600" },
  secondary: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.hairline,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s.md,
  },
  secondaryLabel: { color: c.text, fontSize: 15, fontWeight: "500" },
  pressed: { opacity: 0.9 },
  panel: { borderRadius: 24, backgroundColor: c.panel, padding: s.lg },
  title: { fontSize: 32, fontWeight: "600", color: c.text, letterSpacing: -0.6 },
  label: { fontSize: 14, fontWeight: "700", color: c.textSoft, textTransform: "uppercase", letterSpacing: 1 },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.hairline,
  },
  rowLabel: { fontSize: 15, color: c.textFaint },
  rowValue: { fontSize: 17, fontWeight: "500", color: c.text },
});
