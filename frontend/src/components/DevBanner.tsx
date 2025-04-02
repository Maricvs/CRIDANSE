import React, { useState } from "react";

const DevBanner: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setError("Введите корректный email");
      return;
    }

    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail("");
        setError("");
      } else {
        throw new Error("Ошибка при отправке");
      }
    } catch (err) {
      setError("Не удалось отправить. Попробуйте позже.");
    }
  };

  return (
    <div style={{
      backgroundColor: "#393834",
      color: "#ffffff",
      padding: "20px",
      borderRadius: "10px",
      margin: "20px auto",
      maxWidth: "768px",
      border: "1px solid #3e3e3d",
      textAlign: "center",
    }}>
      <h3 style={{ marginBottom: "10px" }}>🚧 Проект в разработке</h3>
      <p style={{ marginBottom: "16px" }}>
        Мы почти готовы! Оставьте свой email — и мы вас уведомим.
      </p>

      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "8px", width: "250px", borderRadius: "4px", background: "#b3b2b2", border: "1px solid #ccc" }}
          />
          <button type="submit" style={{
            padding: "8px 16px",
            backgroundColor: "#ffc107",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
            Уведомить
          </button>
        </form>
      ) : (
        <p>✅ Спасибо! Мы уведомим вас, как только всё будет готово.</p>
      )}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default DevBanner;