// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Glassmorphism Dark" — deep purple-to-black gradient with
   soft purple/pink glow orbs, frosted translucent header/rows, and
   gold/silver/bronze glass cards for the top 3, echoing the reference
   "Leaderboard" glass UI. Same column set (rank / team / played / kills /
   placement / booyah / total) as every other theme. ---- */
export function renderGlassDarkDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9; // default: 2 columns x 9 rows = 18 teams per table/image
  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);

  const baseWidth = 1536;
  const outerPad = 44;
  const headerH = 210;
  const colHeadH = 52;
  const rowH = 66;
  const midGap = 72;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const glowOf = (globalRank)=> globalRank===0 ? "#FFD700" : globalRank===1 ? "#C0C0C0" : globalRank===2 ? "#CD7F32" : null;

  /* ---- background: deep purple gradient + soft glow orbs ---- */
  const bgGrad = ctx.createLinearGradient(0,0,width,height);
  bgGrad.addColorStop(0,"#1a1040");
  bgGrad.addColorStop(1,"#0d0722");
  ctx.fillStyle = bgGrad;
  roundRectPath(ctx, 0,0,width,height, 24);
  ctx.fill();

  function orb(cx,cy,r,color){
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0, color+"55");
    g.addColorStop(1, color+"00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fill();
  }
  orb(width-60, -40, 280, "#7C3AED");
  orb(-40, height-30, 220, "#EC4899");

  /* ---- tournament logo, top-left ---- */
  {
    const bigLogoR = 58, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 96;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(167,139,250,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  /* ---- title block ---- */
  const titleX = outerPad + 140;
  ctx.textAlign = "left";

  ctx.save();
  ctx.shadowColor = "rgba(167,139,250,0.55)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 52px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-titleX-220), titleX, 106);
  ctx.restore();

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 13px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(167,139,250,0.7)";
    ctx.fillText(seasonLabel, titleX, 128);
  }

  if(champRush){
    ctx.font = "800 15px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#FFD700";
    drawIconTextLine(ctx, titleX, seasonLabel ? 156 : 130, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:17, align:"left"});
  }

  /* ---- shared column geometry ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, headerH, colW, tableH],[rightX, headerH, colW, tableH]]);
  const rankW=64, playedW=64, killsW=64, placementW=82, booyahW=80, totalW=108;
  const teamW = colW - rankW - playedW - killsW - placementW - booyahW - totalW;

  function colXOf(x0){
    return {
      rank: x0,
      team: x0+rankW,
      played: x0+rankW+teamW,
      kills: x0+rankW+teamW+playedW,
      placement: x0+rankW+teamW+playedW+killsW,
      booyah: x0+rankW+teamW+playedW+killsW+placementW,
      total: x0+rankW+teamW+playedW+killsW+placementW+booyahW
    };
  }

  function drawColumnHeader(x0){
    const headY = headerH;
    roundRectPath(ctx, x0, headY, colW, colHeadH, 10);
    ctx.fillStyle = "rgba(124,58,237,0.22)";
    ctx.fill();

    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#A78BFA";
    ctx.textAlign = "center";
    ctx.fillText("#", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("PLAYED", cx.played+playedW/2, midY);
    ctx.fillText("KILLS", cx.kills+killsW/2, midY);
    ctx.fillText("PLACE", cx.placement+placementW/2, midY);
    ctx.fillText("BOOYAH", cx.booyah+booyahW/2, midY);
    ctx.fillText("PTS", cx.total+totalW/2, midY);
  }

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isActChamp = isActualChampion(r.team.id);
      const glowColor = glowOf(globalRank);
      const rowY = headerH + colHeadH + i*rowH;
      const midY = rowY + rowH/2 + 6;

      // frosted glass row / podium card
      roundRectPath(ctx, x0+1, rowY+3, colW-2, rowH-6, 12);
      ctx.fillStyle = glowColor ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.035)";
      ctx.fill();
      if(glowColor){
        ctx.strokeStyle = glowColor+"77";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      if(isActChamp){
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1.6;
        roundRectPath(ctx, x0+1, rowY+3, colW-2, rowH-6, 12);
        ctx.stroke();
      }

      // rank number
      ctx.textAlign = "center";
      ctx.font = "900 21px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillStyle = glowColor || "#666";
      ctx.fillText(String(globalRank+1), cx.rank+rankW/2, midY);

      // team logo
      const logoR = 20, logoCx = cx.team+26, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#A78BFA";
        ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? "#FFD700" : "#ffffff";
      ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+22) - (isActChamp?26:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#FFD700");
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#9a94b8";
      ctx.font = "700 15px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#2ECC71" : "#4a4560";
      ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

      ctx.fillStyle = glowColor || "#EC4899";
      ctx.font = "900 20px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);
    }
  }

  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  /* ---- footer ---- */
  const footY = headerH+tableH+22;
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a84a8";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8a84a8";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  ctx.textAlign = "right";
  if(pageLabel){
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666080";
    ctx.fillText(pageLabel, width-outerPad, footY+56);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 34 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666080";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(167,139,250,0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Glassmorphism Dark" — "Two Columns (6+6)" layout, capped
   at 6 rows per column (12 teams per image). ---- */
export function renderGlassDarkTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderGlassDarkDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Glassmorphism Dark" — "One Column (12 Teams)" layout,
   single wide column instead of the two-column split above. ---- */
export function renderGlassDarkOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);
  const glowOf = (globalRank)=> globalRank===0 ? "#FFD700" : globalRank===1 ? "#C0C0C0" : globalRank===2 ? "#CD7F32" : null;

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 210;
  const colHeadH = 52;
  const rowH = 68;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0,0,width,height);
  bgGrad.addColorStop(0,"#1a1040");
  bgGrad.addColorStop(1,"#0d0722");
  ctx.fillStyle = bgGrad;
  roundRectPath(ctx, 0,0,width,height, 24);
  ctx.fill();

  function orb(cx,cy,r,color){
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    g.addColorStop(0, color+"55");
    g.addColorStop(1, color+"00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fill();
  }
  orb(width-60, -40, 260, "#7C3AED");
  orb(-40, height-30, 200, "#EC4899");

  {
    const bigLogoR = 52, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 92;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(167,139,250,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  const titleX = outerPad + 122;
  ctx.textAlign = "left";

  ctx.save();
  ctx.shadowColor = "rgba(167,139,250,0.55)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 46px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-titleX-180), titleX, 100);
  ctx.restore();

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "800 13px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(167,139,250,0.7)";
    ctx.fillText(seasonLabel, titleX, 124);
  }

  if(champRush){
    ctx.font = "800 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#FFD700";
    drawIconTextLine(ctx, titleX, seasonLabel ? 150 : 126, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:16, align:"left"});
  }

  const x0 = outerPad + gutter;
  const colW = width - outerPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, headerH, colW, tableH]]);
  const rankW=70, playedW=92, killsW=92, placementW=110, booyahW=104, totalW=138;
  const teamW = colW - rankW - playedW - killsW - placementW - booyahW - totalW;

  const cx = {
    rank: x0,
    team: x0+rankW,
    played: x0+rankW+teamW,
    kills: x0+rankW+teamW+playedW,
    placement: x0+rankW+teamW+playedW+killsW,
    booyah: x0+rankW+teamW+playedW+killsW+placementW,
    total: x0+rankW+teamW+playedW+killsW+placementW+booyahW
  };

  const headY = headerH;
  roundRectPath(ctx, x0, headY, colW, colHeadH, 10);
  ctx.fillStyle = "rgba(124,58,237,0.22)";
  ctx.fill();

  const headMidY = headY+colHeadH/2+5;
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#A78BFA";
  ctx.textAlign = "center";
  ctx.fillText("#", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("PLAYED", cx.played+playedW/2, headMidY);
  ctx.fillText("KILLS", cx.kills+killsW/2, headMidY);
  ctx.fillText("PLACE PTS", cx.placement+placementW/2, headMidY);
  ctx.fillText("BOOYAH", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("PTS", cx.total+totalW/2, headMidY);

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isActChamp = isActualChampion(r.team.id);
    const glowColor = glowOf(globalRank);
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    roundRectPath(ctx, x0+1, rowY+3, colW-2, rowH-6, 12);
    ctx.fillStyle = glowColor ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.035)";
    ctx.fill();
    if(glowColor){
      ctx.strokeStyle = glowColor+"77";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    if(isActChamp){
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1.6;
      roundRectPath(ctx, x0+1, rowY+3, colW-2, rowH-6, 12);
      ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.font = "900 22px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = glowColor || "#666";
    ctx.fillText(String(globalRank+1), cx.rank+rankW/2, midY);

    const logoR = 21, logoCx = cx.team+27, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#A78BFA";
      ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? "#FFD700" : "#ffffff";
    ctx.font = "700 18px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+24) - (isActChamp?26:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+15, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-15, midY-7, 15, "#FFD700");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#9a94b8";
    ctx.font = "700 16px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#2ECC71" : "#4a4560";
    ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

    ctx.fillStyle = glowColor || "#EC4899";
    ctx.font = "900 21px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);
  }

  const footY = headerH+tableH+22;
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a84a8";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8a84a8";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  ctx.textAlign = "right";
  if(pageLabel){
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666080";
    ctx.fillText(pageLabel, width-outerPad, footY+56);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 34 + 34;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666080";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(167,139,250,0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
