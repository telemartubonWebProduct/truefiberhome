"use client";

import { useEffect, useState } from "react";
import { Box, Button, Typography, Link } from "@mui/material";

const COOKIE_KEY = "cookie-consent-accepted";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const accepted = typeof window !== "undefined"
        ? window.localStorage.getItem(COOKIE_KEY)
        : null;

      if (!accepted) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      window.localStorage.setItem(COOKIE_KEY, "true");
      const gtag = (window as typeof window & {
        gtag?: (...args: unknown[]) => void;
      }).gtag;

      gtag?.("consent", "update", {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const handleClose = () => {
    // ปิดอย่างเดียว (สำหรับผู้ใช้ที่ยังไม่อยากยอมรับ)
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(6px)",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "400px",
          bgcolor: "rgba(15, 23, 42, 0.95)",
          color: "white",
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 0.5, fontFamily: "Prompt", fontSize: "0.95rem" }}
        >
          เราใช้คุกกี้เพื่อประสบการณ์ที่ดียิ่งขึ้น 🍪
        </Typography>
        <Typography
          variant="body2"
          sx={{ opacity: 0.85, fontSize: "0.8rem", fontFamily: "Prompt", lineHeight: 1.5 }}
        >
          เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อปรับปรุงประสบการณ์ของคุณและวิเคราะห์การใช้งานเว็บไซต์ 
          อ่านรายละเอียดเพิ่มเติมได้ที่{" "}
          <Link
            href="/termsAndPrivacy"
            underline="hover"
            sx={{ color: "#38bdf8", fontWeight: 500 }}
          >
            นโยบายความเป็นส่วนตัว
          </Link>
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
          mt: 0.5,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={handleClose}
          sx={{
            borderColor: "rgba(148,163,184,0.4)",
            color: "rgba(226,232,240,0.9)",
            fontFamily: "Prompt",
            fontSize: "0.75rem",
            px: 2,
            "&:hover": { borderColor: "rgba(148,163,184,0.8)", bgcolor: "rgba(255,255,255,0.05)" }
          }}
        >
          ปิด
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleAccept}
          sx={{
            bgcolor: "#22c55e",
            color: "#fff",
            fontFamily: "Prompt",
            fontSize: "0.75rem",
            px: 3,
            "&:hover": { bgcolor: "#16a34a" },
            boxShadow: "none"
          }}
        >
          ยอมรับทั้งหมด
        </Button>
      </Box>
      </Box>
    </Box>
  );
}