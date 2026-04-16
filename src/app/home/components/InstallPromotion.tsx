"use client";

import { Box, Typography, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";
import { lineSupport } from "@/src/context/line-path";

interface InstallPromotionContent {
  title: string;
  topLine: string;
  priceText: string;
  bottomLine: string;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
  footerText: string;
  isActive: boolean;
}

interface InstallPromotionProps {
  content: InstallPromotionContent;
}

export default function InstallPromotion({ content }: InstallPromotionProps) {
  if (!content.isActive) {
    return null;
  }

  const titleLines = content.title.split("\n");
  const normalizedPrimaryHref = content.primaryButtonHref?.trim();
  const primaryButtonHref =
    normalizedPrimaryHref && normalizedPrimaryHref !== "/service" && normalizedPrimaryHref !== "#"
      ? normalizedPrimaryHref
      : lineSupport;
  const secondaryButtonHref = content.secondaryButtonHref?.trim()
    ? content.secondaryButtonHref
    : "/home#packages";

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)',
        color: 'white', 
        p: { xs: 4, md: 5 }, 
        minHeight: 280,
        boxShadow: '0 12px 40px rgba(183, 28, 28, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Typography 
        component={motion.h3}
        animate={{ 
          y: [0, -4, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        variant="h4" 
        sx={{ 
            fontWeight: 800, 
            mb: 2, 
            textAlign: 'center', 
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            lineHeight: 1.3,
            textShadow: '0px 2px 8px rgba(0,0,0,0.25)',
            willChange: 'transform'
        }}
      >
        {titleLines.map((line, idx) => (
          <span key={`${line}-${idx}`}>
            {idx > 0 && <br />}
            {line}
          </span>
        ))}
      </Typography>
      
      <Typography 
        component={motion.p}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        variant="subtitle1" 
        sx={{ 
            mb: 4, 
            textAlign: 'center', 
            fontSize: { xs: '1rem', md: '1.25rem' },
            fontWeight: 400,
            lineHeight: 1.6,
            willChange: 'opacity'
        }}
      >
        {content.topLine}{" "}
        <span style={{color: '#ffca28', fontWeight: 'bold', fontSize: '1.15em', textShadow: '0px 1px 4px rgba(0,0,0,0.2)'}}>
          {content.priceText}
        </span>
        <br/>
        {content.bottomLine}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          style={{ willChange: 'transform' }}
        >
          <Button 
            component="a"
            href={primaryButtonHref}
            variant="contained"
            disableElevation
            sx={{ 
              px: { xs: 3, md: 4 }, 
              py: 1.5, 
              bgcolor: '#ffca28', 
              color: '#1a1a1a', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              borderRadius: '50px',
              boxShadow: '0 4px 14px rgba(255, 202, 40, 0.4)',
              '&:hover': { bgcolor: '#ffb300', boxShadow: '0 6px 20px rgba(255, 202, 40, 0.6)' } 
            }}
          >
            {content.primaryButtonLabel}
          </Button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          style={{ willChange: 'transform' }}
        >
          <Button 
            component="a"
            href={secondaryButtonHref}
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              px: { xs: 3, md: 4 }, 
              py: 1.5, 
              borderColor: 'rgba(255,255,255,0.6)', 
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'white', 
              fontWeight: 600, 
              fontSize: '1.1rem', 
              borderRadius: '50px',
              backdropFilter: 'blur(4px)',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.15)' } 
            }}
          >
            {content.secondaryButtonLabel}
          </Button>
        </motion.div>
      </Box>

      <Typography 
        variant="body2" 
        sx={{ 
            textAlign: 'center', 
            opacity: 0.75,
            fontSize: '0.95rem',
            fontWeight: 300,
            letterSpacing: '0.5px'
        }}
      >
        {content.footerText}
      </Typography>
    </Box>
  );
}
