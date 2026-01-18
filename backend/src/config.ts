export const config = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  cookieName: "darepot_session",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  serverPort: Number(process.env.PORT || 4000),
  creditsStartMinor: 100000,
  rouletteCountdownSeconds: 15,
};
