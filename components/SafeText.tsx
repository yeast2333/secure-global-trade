// 安全技术点：展示层数据脱敏（最小暴露原则）
// 在 UI 层面对 PII / 业务敏感字段统一遮蔽，避免运营截图、日志快照泄露
type Variant = "email" | "order" | "phone";

type SafeTextProps = {
  value: string;
  variant?: Variant;
  className?: string;
};

function maskEmail(value: string) {
  const [user, domain] = value.split("@");
  if (!domain) return value.replace(/.(?=.{2})/g, "*");
  if (user.length <= 2) {
    return `${user[0] ?? ""}*@${domain}`;
  }
  return `${user.slice(0, 2)}${"*".repeat(Math.max(2, user.length - 4))}${user.slice(-2)}@${domain}`;
}

function maskOrder(value: string) {
  if (value.length <= 6) return value;
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function maskPhone(value: string) {
  if (value.length < 7) return value;
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
}

export default function SafeText({
  value,
  variant = "email",
  className = "",
}: SafeTextProps) {
  if (!value) return null;
  let masked = value;
  if (variant === "email") masked = maskEmail(value);
  else if (variant === "order") masked = maskOrder(value);
  else if (variant === "phone") masked = maskPhone(value);

  return (
    <span className={className} title="masked for safety">
      {masked}
    </span>
  );
}
