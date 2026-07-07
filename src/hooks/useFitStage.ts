// hooks/useFitStage.ts
// Hook คำนวณ scale factor สำหรับ 16:9 Fixed Stage
"use client";
import { useEffect, useState } from "react";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const DESKTOP_BREAKPOINT = 1024;

interface FitStageState {
  scale: number;
  isDesktopStage: boolean;
  stageWidth: number;
  stageHeight: number;
}

export function useFitStage(): FitStageState {
  const [state, setState] = useState<FitStageState>({
    scale: 1,
    isDesktopStage: true,
    stageWidth: DESIGN_WIDTH,
    stageHeight: DESIGN_HEIGHT,
  });

  useEffect(() => {
    function recalc() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isDesktopStage = vw >= DESKTOP_BREAKPOINT;

      if (!isDesktopStage) {
        setState({
          scale: 1,
          isDesktopStage: false,
          stageWidth: vw,
          stageHeight: vh,
        });
        return;
      }

      const scale = Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT);
      setState({
        scale,
        isDesktopStage: true,
        stageWidth: DESIGN_WIDTH,
        stageHeight: DESIGN_HEIGHT,
      });
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  return state;
}
