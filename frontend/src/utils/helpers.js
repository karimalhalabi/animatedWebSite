export const initials = (name) =>
  (name || "عضو")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
export const timeLabel = (value) =>
  new Intl.DateTimeFormat("ar", { hour: "numeric", minute: "2-digit" }).format(
    new Date(value),
  );
export const dateLabel = (value) =>
  new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
export function request(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!socket.connected) return reject(new Error("الاتصال بالخادم غير متاح"));
    socket.timeout(12000).emit(event, payload, (err, response) => {
      if (err) return reject(new Error("تأخر الرد، يرجى المحاولة مجدداً"));
      if (!response?.ok)
        return reject(new Error(response?.error || "حدث خطأ غير متوقع"));
      resolve(response.data);
    });
  });
}
