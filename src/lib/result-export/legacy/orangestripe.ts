// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, playerPhotoOverRect, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Orange Stripe" — compact near-black card with a solid
   orange header band, a dark sub-header row and tight zebra-striped rows,
   echoing the reference "PONTUAÇÃO GERAL" compact scoreboard. Same column
   set (rank / team / played / kills / placement / booyah / total) as
   every other theme. ---- */
export function renderOrangeStripeDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9; // default: 2 columns x 9 rows = 18 teams per table/image
  const leftRanks  = ranks.slice(0, rowsPerCol);
  const rightRanks = ranks.slice(rowsPerCol, rowsPerCol*2);
  const leftLogos  = logos.slice(0, rowsPerCol);
  const rightLogos = logos.slice(rowsPerCol, rowsPerCol*2);
  const numRows = Math.max(leftRanks.length, rightRanks.length, 1);

  const baseWidth = 1536;
  const outerPad = 0;
  const cardPad = 40;
  const bandH = 108;
  const colHeadH = 46;
  const rowH = 60;
  const midGap = 4;
  const footerH = 66 + (sponsorLogos.length ? 56 : 0);
  const headerH = bandH + 28;
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, bandH+14, tableH, bandH+6, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 30;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: near-black rounded card ---- */
  roundRectPath(ctx, 0,0,width,height, 14);
  ctx.fillStyle = "#111111";
  ctx.fill();

  /* ---- solid orange header band ---- */
  roundRectPath(ctx, 0,0,width,bandH, 14);
  ctx.fillStyle = "#FF8C00";
  ctx.fill();
  ctx.fillRect(0, bandH-14, width, 14); // square off the bottom corners

  {
    const bigLogoR = 30, bigLogoCx = cardPad+bigLogoR, bigLogoCy = bandH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#ffffff33";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 40px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-(bigLogoCx+bigLogoR+18)-280), bigLogoCx+bigLogoR+18, bandH/2+14);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.fillText(seasonLabel, width-cardPad, bandH/2+2);
  }
  if(champRush){
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    drawIconTextLine(ctx, width-cardPad, bandH/2+22, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:15});
  }

  /* ---- dark sub-header row ---- */
  const subY = bandH+14;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cardPad+gutter, subY, width-cardPad*2-gutter, colHeadH);

  /* ---- shared column geometry ---- */
  const colW = (width - cardPad*2 - gutter - midGap)/2;
  const leftX = cardPad + gutter;
  const rightX = leftX + colW + midGap;
  const midX = leftX + colW + midGap/2; // centre of the gap between the two columns
  drawPlayerPhoto(ctx, photo, [[leftX, subY, colW, tableH],[rightX, subY, colW, tableH]]);
  const rankW=60, playedW=58, killsW=58, placementW=80, booyahW=76, totalW=96;
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
    const cx = colXOf(x0);
    const midY = subY+colHeadH/2+5;
    ctx.font = "800 11px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#FF8C00";
    ctx.textAlign = "center";
    ctx.fillText("#", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("JOGOS", cx.played+playedW/2, midY);
    ctx.fillText("ABATES", cx.kills+killsW/2, midY);
    ctx.fillText("COLOC.", cx.placement+placementW/2, midY);
    ctx.fillText("BOOYAH", cx.booyah+booyahW/2, midY);
    ctx.fillText("TOTAL", cx.total+totalW/2, midY);
  }

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    const bodyY = subY+colHeadH;
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isTop3 = globalRank < 3;
      const isActChamp = isActualChampion(r.team.id);
      const rowY = bodyY + i*rowH;
      const midY = rowY + rowH/2 + 6;

      ctx.fillStyle = i%2===0 ? "#161616" : "#111111";
      ctx.fillRect(x0, rowY, colW, rowH);

      playerPhotoOverRect(ctx, photo, x0, rowY, colW, rowH);
      if(isActChamp){
        ctx.fillStyle = "rgba(255,140,0,0.10)";
        ctx.fillRect(x0, rowY, colW, rowH);
      }
      ctx.fillStyle = isTop3 ? "#FF8C00" : "transparent";
      ctx.fillRect(x0, rowY, 3, rowH);

      // rank number, zero-padded monospace
      const rankColor = globalRank===0 ? "#FFD700" : globalRank===1 ? "#C0C0C0" : globalRank===2 ? "#CD7F32" : "#555555";
      ctx.textAlign = "center";
      ctx.font = "900 18px 'Courier New', monospace";
      ctx.fillStyle = rankColor;
      ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

      // team logo
      const logoR = 17, logoCx = cx.team+22, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#FF8C00";
        ctx.font = "800 13px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+4);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = isActChamp ? "#FF8C00" : "#ffffff";
      ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+18) - (isActChamp?22:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+12, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-12, midY-7, 13, "#FF8C00");
      }

      // stat columns
      ctx.textAlign = "center";
      ctx.fillStyle = "#666666";
      ctx.font = "700 14px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#2ECC71" : "#333333";
      ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(r.wins ? String(r.wins).padStart(2,"0") : "—", cx.booyah+booyahW/2, midY);

      ctx.fillStyle = "#FF8C00";
      ctx.font = "900 19px Rajdhani, 'Segoe UI', sans-serif";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);
    }
  }

  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  /* ---- footer ---- */
  const realFootY = subY + colHeadH + rowH*numRows + 22;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardPad, realFootY);
  ctx.lineTo(width-cardPad, realFootY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#555555";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, realFootY+30);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(dateLabel, cardPad, realFootY+32);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(pageLabel, width-cardPad, realFootY+32);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = realFootY + 30 + 32;
    let sLogoCx = width - cardPad - sLogoR;
    const totalWs = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - cardPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,140,0,0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Orange Stripe" — "Two Columns (6+6)" layout, capped at 6
   rows per column (12 teams per image). ---- */
export function renderOrangeStripeTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderOrangeStripeDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Orange Stripe" — "One Column (12 Teams)" layout, single
   wide column instead of the two-column split above. ---- */
export function renderOrangeStripeOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const cardPad = 44;
  const bandH = 100;
  const colHeadH = 44;
  const rowH = 62;
  const footerH = 66 + (sponsorLogos.length ? 56 : 0);
  const headerH = bandH + 26;
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, bandH+14, tableH, bandH+6, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 30;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  roundRectPath(ctx, 0,0,width,height, 14);
  ctx.fillStyle = "#111111";
  ctx.fill();

  roundRectPath(ctx, 0,0,width,bandH, 14);
  ctx.fillStyle = "#FF8C00";
  ctx.fill();
  ctx.fillRect(0, bandH-14, width, 14);

  {
    const bigLogoR = 27, bigLogoCx = cardPad+bigLogoR, bigLogoCy = bandH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#ffffff33";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 34px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-(bigLogoCx+bigLogoR+16)-230), bigLogoCx+bigLogoR+16, bandH/2+12);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.fillText(seasonLabel, width-cardPad, bandH/2);
  }
  if(champRush){
    ctx.font = "800 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    drawIconTextLine(ctx, width-cardPad, bandH/2+20, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:14});
  }

  const subY = bandH+14;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cardPad+gutter, subY, width-cardPad*2-gutter, colHeadH);

  const x0 = cardPad + gutter;
  const colW = width - cardPad*2 - gutter;
  drawPlayerPhoto(ctx, photo, [[x0, subY, colW, tableH]]);
  const rankW=66, playedW=84, killsW=84, placementW=100, booyahW=96, totalW=126;
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

  const headMidY = subY+colHeadH/2+5;
  ctx.font = "800 11px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#FF8C00";
  ctx.textAlign = "center";
  ctx.fillText("#", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("JOGOS", cx.played+playedW/2, headMidY);
  ctx.fillText("ABATES", cx.kills+killsW/2, headMidY);
  ctx.fillText("COLOCAÇÃO", cx.placement+placementW/2, headMidY);
  ctx.fillText("BOOYAH", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("TOTAL", cx.total+totalW/2, headMidY);

  const bodyY = subY+colHeadH;
  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isTop3 = globalRank < 3;
    const isActChamp = isActualChampion(r.team.id);
    const rowY = bodyY + i*rowH;
    const midY = rowY + rowH/2 + 6;

    ctx.fillStyle = i%2===0 ? "#161616" : "#111111";
    ctx.fillRect(x0, rowY, colW, rowH);

    playerPhotoOverRect(ctx, photo, x0, rowY, colW, rowH);
    if(isActChamp){
      ctx.fillStyle = "rgba(255,140,0,0.10)";
      ctx.fillRect(x0, rowY, colW, rowH);
    }
    ctx.fillStyle = isTop3 ? "#FF8C00" : "transparent";
    ctx.fillRect(x0, rowY, 3, rowH);

    const rankColor = globalRank===0 ? "#FFD700" : globalRank===1 ? "#C0C0C0" : globalRank===2 ? "#CD7F32" : "#555555";
    ctx.textAlign = "center";
    ctx.font = "900 19px 'Courier New', monospace";
    ctx.fillStyle = rankColor;
    ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

    const logoR = 19, logoCx = cx.team+24, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#FF8C00";
      ctx.font = "800 14px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+4);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = isActChamp ? "#FF8C00" : "#ffffff";
    ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+20) - (isActChamp?22:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+13, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-12, midY-7, 14, "#FF8C00");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#666666";
    ctx.font = "700 15px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#2ECC71" : "#333333";
    ctx.font = "800 15px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(r.wins ? String(r.wins).padStart(2,"0") : "—", cx.booyah+booyahW/2, midY);

    ctx.fillStyle = "#FF8C00";
    ctx.font = "900 20px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);
  }

  const realFootY = subY + colHeadH + rowH*numRows + 22;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardPad, realFootY);
  ctx.lineTo(width-cardPad, realFootY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#555555";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, realFootY+30);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(dateLabel, cardPad, realFootY+32);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(pageLabel, width-cardPad, realFootY+32);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = realFootY + 30 + 32;
    let sLogoCx = width - cardPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - cardPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,140,0,0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
