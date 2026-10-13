// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Military Tactical" — dark olive "kill report" card with a
   khaki-green kicker/border, muted stat columns and a bright green rank
   and total for the top 3, echoing the reference tactical dossier
   leaderboard. Same column set (rank / team / played / kills /
   placement / booyah / total) as every other theme. ---- */
export function renderMilitaryDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
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
  const colHeadH = 44;
  const rowH = 64;
  const midGap = 72;
  const footerH = 76 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  /* ---- background: dark olive with a khaki border frame ---- */
  ctx.fillStyle = "#1A1F0F";
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle = "#4A5C2A";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5,1.5,width-3,height-3);

  /* ---- tournament logo, top-left ---- */
  {
    const bigLogoR = 58, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 96;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#141709";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#4A5C2A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  /* ---- title block ---- */
  const titleX = outerPad + 140;
  ctx.textAlign = "left";

  ctx.fillStyle = "#D4E09B";
  ctx.font = "900 50px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-titleX-200), titleX, 80);

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#4A5C2A";
    ctx.fillText(seasonLabel, titleX, 120);
  }

  if(champRush){
    ctx.font = "800 15px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8BC34A";
    drawIconTextLine(ctx, titleX, seasonLabel ? 148 : 122, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:17, align:"left"});
  }

  ctx.textAlign = "right";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#4A5C2A";
  const dateLabelTop = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabelTop) ctx.fillText("DATE: "+dateLabelTop, width-outerPad, 40);
  if(pageLabel) ctx.fillText(pageLabel.toUpperCase(), width-outerPad, 62);

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
    const cx = colXOf(x0);
    const midY = headY+colHeadH/2+5;
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8BC34A";
    ctx.textAlign = "center";
    ctx.fillText("RANK", cx.rank+rankW/2, midY);
    ctx.textAlign = "left";
    ctx.fillText("TEAM", cx.team+8, midY);
    ctx.textAlign = "center";
    ctx.fillText("M", cx.played+playedW/2, midY);
    ctx.fillText("ELM", cx.kills+killsW/2, midY);
    ctx.fillText("PKP", cx.placement+placementW/2, midY);
    ctx.fillText("BOOYAH", cx.booyah+booyahW/2, midY);
    ctx.fillText("SCORE", cx.total+totalW/2, midY);

    ctx.strokeStyle = "#4A5C2A66";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, headY+colHeadH);
    ctx.lineTo(x0+colW, headY+colHeadH);
    ctx.stroke();
  }

  function drawColumnRows(x0, colRanks, colLogos, rankOffset){
    const cx = colXOf(x0);
    for(let i=0;i<colRanks.length;i++){
      const r = colRanks[i];
      const globalRank = rankOffset+i;
      const isTop3 = globalRank < 3;
      const isActChamp = isActualChampion(r.team.id);
      const accent = isTop3 ? "#8BC34A" : "#4A5C2A";
      const rowY = headerH + colHeadH + i*rowH;
      const midY = rowY + rowH/2 + 6;

      if(isActChamp){
        ctx.fillStyle = "rgba(139,195,74,0.10)";
        ctx.fillRect(x0, rowY, colW, rowH);
      }

      // rank number, zero-padded monospace
      ctx.textAlign = "center";
      ctx.font = "900 19px 'Courier New', monospace";
      ctx.fillStyle = accent;
      ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

      // small square bullet + team logo
      ctx.fillStyle = accent;
      ctx.fillRect(cx.team, rowY+rowH/2-3, 6, 6);

      const logoR = 19, logoCx = cx.team+34, logoCy = rowY+rowH/2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#141709";
      ctx.fill();
      ctx.clip();
      const img = colLogos[i];
      if(img){
        ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
      }else{
        ctx.fillStyle = "#8BC34A";
        ctx.font = "800 15px Rajdhani, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
      }
      ctx.restore();
      ctx.strokeStyle = "#4A5C2A88";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
      ctx.stroke();

      // team name
      ctx.textAlign = "left";
      ctx.fillStyle = "#D4E09B";
      ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
      const nameMaxW = teamW - (logoR*2+30) - (isActChamp?24:0);
      ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+13, midY-3);
      if(isActChamp){
        drawCanvasIcon(ctx, "trophy", cx.team+teamW-13, midY-7, 14, "#8BC34A");
      }

      // stat columns — muted olive monospace
      ctx.textAlign = "center";
      ctx.fillStyle = "#8a9a6a";
      ctx.font = "700 15px 'Courier New', monospace";
      ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
      ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
      ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
      ctx.fillStyle = r.wins ? "#8BC34A" : "#4A5C2A";
      ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

      ctx.fillStyle = accent;
      ctx.font = "900 20px 'Courier New', monospace";
      ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

      // row divider
      ctx.strokeStyle = "#4A5C2A22";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, rowY+rowH);
      ctx.lineTo(x0+colW, rowY+rowH);
      ctx.stroke();
    }
  }

  drawColumnHeader(leftX);
  drawColumnHeader(rightX);
  drawColumnRows(leftX, leftRanks, leftLogos, startIndex);
  drawColumnRows(rightX, rightRanks, rightLogos, startIndex+rowsPerCol);

  // center divider
  ctx.strokeStyle = "#4A5C2A44";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX, headerH);
  ctx.lineTo(midX, headerH+tableH);
  ctx.stroke();

  /* ---- footer ---- */
  const footY = headerH+tableH+24;
  ctx.strokeStyle = "#4A5C2A44";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#4A5C2A";
  ctx.fillText("M = MATCHES  ·  ELM = KILLS  ·  PKP = PLACEMENT PTS  ·  BOOYAH = WINS", outerPad, footY+30);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#4A5C2A";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+58);
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
    ctx.fillStyle = "#4A5C2A";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#141709";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#4A5C2A88";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Military Tactical" — "Two Columns (6+6)" layout, capped
   at 6 rows per column (12 teams per image). ---- */
export function renderMilitaryTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderMilitaryDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Military Tactical" — "One Column (12 Teams)" layout,
   single wide column instead of the two-column split above. ---- */
export function renderMilitaryOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const numRows = Math.max(pageRanks.length, 1);

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 200;
  const colHeadH = 44;
  const rowH = 66;
  const footerH = 76 + (sponsorLogos.length ? 56 : 0);
  const tableH = colHeadH + rowH*numRows;
  const photo = planPlayerPhoto(baseWidth, headerH, tableH, headerH-14, {overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + tableH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1A1F0F";
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle = "#4A5C2A";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5,1.5,width-3,height-3);

  {
    const bigLogoR = 50, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 90;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#141709";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#4A5C2A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  const titleX = outerPad + 120;
  ctx.textAlign = "left";

  ctx.fillStyle = "#D4E09B";
  ctx.font = "900 44px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-titleX-170), titleX, 74);

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#4A5C2A";
    ctx.fillText(seasonLabel, titleX, 110);
  }

  if(champRush){
    ctx.font = "800 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8BC34A";
    drawIconTextLine(ctx, titleX, seasonLabel ? 136 : 112, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:16, align:"left"});
  }

  ctx.textAlign = "right";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#4A5C2A";
  const dateLabelTop = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabelTop) ctx.fillText("DATE: "+dateLabelTop, width-outerPad, 36);
  if(pageLabel) ctx.fillText(pageLabel.toUpperCase(), width-outerPad, 58);

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
  const headMidY = headY+colHeadH/2+5;
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#8BC34A";
  ctx.textAlign = "center";
  ctx.fillText("RANK", cx.rank+rankW/2, headMidY);
  ctx.textAlign = "left";
  ctx.fillText("TEAM", cx.team+8, headMidY);
  ctx.textAlign = "center";
  ctx.fillText("MATCHES", cx.played+playedW/2, headMidY);
  ctx.fillText("ELM", cx.kills+killsW/2, headMidY);
  ctx.fillText("PKP", cx.placement+placementW/2, headMidY);
  ctx.fillText("BOOYAH", cx.booyah+booyahW/2, headMidY);
  ctx.fillText("SCORE", cx.total+totalW/2, headMidY);

  ctx.strokeStyle = "#4A5C2A66";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, headY+colHeadH);
  ctx.lineTo(x0+colW, headY+colHeadH);
  ctx.stroke();

  for(let i=0;i<pageRanks.length;i++){
    const r = pageRanks[i];
    const globalRank = startIndex+i;
    const isTop3 = globalRank < 3;
    const isActChamp = isActualChampion(r.team.id);
    const accent = isTop3 ? "#8BC34A" : "#4A5C2A";
    const rowY = headerH + colHeadH + i*rowH;
    const midY = rowY + rowH/2 + 6;

    if(isActChamp){
      ctx.fillStyle = "rgba(139,195,74,0.10)";
      ctx.fillRect(x0, rowY, colW, rowH);
    }

    ctx.textAlign = "center";
    ctx.font = "900 20px 'Courier New', monospace";
    ctx.fillStyle = accent;
    ctx.fillText(String(globalRank+1).padStart(2,"0"), cx.rank+rankW/2, midY);

    ctx.fillStyle = accent;
    ctx.fillRect(cx.team, rowY+rowH/2-3, 6, 6);

    const logoR = 20, logoCx = cx.team+36, logoCy = rowY+rowH/2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#141709";
    ctx.fill();
    ctx.clip();
    const img = pageLogos[i];
    if(img){
      ctx.drawImage(img, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
    }else{
      ctx.fillStyle = "#8BC34A";
      ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), logoCx, logoCy+5);
    }
    ctx.restore();
    ctx.strokeStyle = "#4A5C2A88";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#D4E09B";
    ctx.font = "700 17px Rajdhani, 'Segoe UI', sans-serif";
    const nameMaxW = teamW - (logoR*2+32) - (isActChamp?24:0);
    ctx.fillText(fitCanvasText(ctx, r.team.name, nameMaxW), logoCx+logoR+14, midY-3);
    if(isActChamp){
      drawCanvasIcon(ctx, "trophy", cx.team+teamW-13, midY-7, 14, "#8BC34A");
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#8a9a6a";
    ctx.font = "700 16px 'Courier New', monospace";
    ctx.fillText(String(r.matches), cx.played+playedW/2, midY);
    ctx.fillText(String(r.totalKills), cx.kills+killsW/2, midY);
    ctx.fillText(String(r.placementPts), cx.placement+placementW/2, midY);
    ctx.fillStyle = r.wins ? "#8BC34A" : "#4A5C2A";
    ctx.fillText(r.wins ? String(r.wins) : "—", cx.booyah+booyahW/2, midY);

    ctx.fillStyle = accent;
    ctx.font = "900 21px 'Courier New', monospace";
    ctx.fillText(String(r.totalPoints), cx.total+totalW/2, midY);

    ctx.strokeStyle = "#4A5C2A22";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, rowY+rowH);
    ctx.lineTo(x0+colW, rowY+rowH);
    ctx.stroke();
  }

  const footY = headerH+tableH+24;
  ctx.strokeStyle = "#4A5C2A44";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#4A5C2A";
  ctx.fillText("M = MATCHES  ·  ELM = KILLS  ·  PKP = PLACEMENT PTS  ·  BOOYAH = WINS", outerPad, footY+30);

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#4A5C2A";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+58);
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
    ctx.fillStyle = "#4A5C2A";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#141709";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#4A5C2A88";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
