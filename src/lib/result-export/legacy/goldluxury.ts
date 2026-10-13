// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, drawPlayerPhoto, planPlayerPhoto, roundRectPath } from "./canvas-utils";
import { fitCanvasText } from "./podium";

/* ---- DESIGN: "Gold Luxury" — a dark gold-trimmed card with a "Hall of
   Champions" podium (medal bars, tallest for #1) for the top 3 on the
   first page, followed by a minimal gold-on-black list for the rest,
   echoing the reference luxury awards ceremony. Same underlying data
   (rank / team / played / kills / placement / booyah / total) as every
   other theme — the podium simply surfaces it differently for the top 3. ---- */
export function drawGoldPodiumTeam(ctx, cx, baseY, barW, barH, borderColor, textColor, team, logoImg, total, isActChamp){
  // Empilement de haut en bas, écarts fixes : logo → nom → barre. Dans la
  // version d'origine le nom était posé sur la même ligne que le bas du logo
  // (chevauchement) et le logo du 1er remontait jusque dans l'en-tête.
  const barY = baseY - barH;
  const nameY = barY - 14;                 // ligne de base du nom, juste au-dessus de la barre
  const medalR = 26;
  const medalCy = nameY - 16 - 12 - medalR; // hauteur du texte (~16px) + 12px d'air

  // médaillon du logo, anneau couleur du rang
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, medalCy, medalR, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = "#1a1200";
  ctx.fill();
  ctx.clip();
  if(logoImg){
    ctx.drawImage(logoImg, cx-medalR, medalCy-medalR, medalR*2, medalR*2);
  }else{
    ctx.fillStyle = textColor;
    ctx.font = "800 20px Rajdhani, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((team.name||"?").charAt(0).toUpperCase(), cx, medalCy+1);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, medalCy, medalR, 0, Math.PI*2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.font = "900 16px Rajdhani, 'Segoe UI', sans-serif";
  const label = fitCanvasText(ctx, team.name.toUpperCase(), barW+30 - (isActChamp ? 24 : 0));
  ctx.fillText(label, cx, nameY);
  if(isActChamp){
    drawCanvasIcon(ctx, "trophy", cx+ctx.measureText(label).width/2+14, nameY-6, 14, "#FFD700");
  }

  // bar
  const barX = cx-barW/2;
  const barGrad = ctx.createLinearGradient(0,barY,0,baseY);
  barGrad.addColorStop(0, borderColor+"33");
  barGrad.addColorStop(1, "transparent");
  ctx.fillStyle = barGrad;
  roundRectPath(ctx, barX, barY, barW, barH, 6);
  ctx.fill();
  ctx.strokeStyle = borderColor+"88";
  ctx.lineWidth = 1.2;
  roundRectPath(ctx, barX, barY, barW, barH, 6);
  ctx.stroke();
  ctx.fillStyle = borderColor;
  ctx.fillRect(barX, baseY-4, barW, 4);

  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.font = "900 30px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(String(total), cx, barY+barH/2+10);
}

export function drawGoldRestRow(ctx, x0, colW, r, globalRank, logoImg, isActChamp){
  ctx.font = "700 15px 'Courier New', monospace";
  ctx.fillStyle = "#5a4010";
  ctx.textAlign = "left";
  ctx.fillText(String(globalRank+1), x0, 0);

  const logoR = 13, logoCx = x0+54, logoCy = -5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCx, logoCy, logoR, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = "#1a1200";
  ctx.fill();
  ctx.clip();
  if(logoImg){
    ctx.drawImage(logoImg, logoCx-logoR, logoCy-logoR, logoR*2, logoR*2);
  }
  ctx.restore();

  const nameX = logoCx+logoR+12;
  const rightEdge = x0+colW;
  ctx.textAlign = "left";
  ctx.fillStyle = isActChamp ? "#FFD700" : "#aa8820";
  ctx.font = "700 16px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, r.team.name, rightEdge-nameX-190), nameX, 0);

  ctx.textAlign = "right";
  ctx.fillStyle = "#666666";
  ctx.font = "600 12px 'Courier New', monospace";
  let statText = "M"+r.matches+" KLS"+r.totalKills+" PLC"+r.placementPts;
  if(r.wins) statText += "  BOOYAH x"+r.wins;
  ctx.fillText(statText, rightEdge-64, 0);

  ctx.fillStyle = "#D4A017";
  ctx.font = "900 18px 'Courier New', monospace";
  ctx.fillText(String(r.totalPoints), rightEdge, 0);
}

export function renderGoldLuxuryDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, rowsPerCol){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  rowsPerCol = rowsPerCol || 9;
  const showPodium = startIndex === 0;
  const podiumRanks = showPodium ? ranks.slice(0,3) : [];
  const podiumLogos = showPodium ? logos.slice(0,3) : [];
  const restRanks = showPodium ? ranks.slice(3) : ranks.slice(0);
  const restLogos = showPodium ? logos.slice(3) : logos.slice(0);
  const restStart = showPodium ? 3 : startIndex;
  const half = Math.ceil(restRanks.length/2);
  const leftRest = restRanks.slice(0,half), leftLogos2 = restLogos.slice(0,half);
  const rightRest = restRanks.slice(half), rightLogos2 = restLogos.slice(half);
  const maxRestRows = Math.max(leftRest.length, rightRest.length, 1);

  const baseWidth = 1536;
  const outerPad = 44;
  const headerH = 160;
  const podiumH = showPodium ? 340 : 0;
  const rowH = 40;
  const midGap = 72;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const restH = maxRestRows*rowH + 20;
  const photo = planPlayerPhoto(baseWidth, headerH, podiumH + restH, headerH-14, {left:8, overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = baseWidth + gutter;
  const height = headerH + podiumH + restH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0,0,width*0.4,height);
  bgGrad.addColorStop(0,"#1a1200");
  bgGrad.addColorStop(1,"#0a0800");
  roundRectPath(ctx, 0,0,width,height,16);
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.strokeStyle = "#7a6010";
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, 1,1,width-2,height-2,16);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#B8920A";
  ctx.font = "700 22px Georgia, serif";
  ctx.fillText("✦ ✦ ✦", width/2, 44);

  ctx.fillStyle = "#D4A017";
  ctx.font = "900 44px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-220), width/2, 88);

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.fillStyle = "#7a6010";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(seasonLabel, width/2, 118);
  }

  if(champRush){
    ctx.font = "800 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#D4A017";
    drawIconTextLine(ctx, width/2, 144, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:15});
  }

  {
    const bigLogoR = 38, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 70;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1a1200";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#7a6010";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  drawPlayerPhoto(ctx, photo, [[outerPad+gutter, headerH, width-outerPad*2-gutter, podiumH + restH]]);
  if(showPodium && podiumRanks.length){
    const order = [1,0,2]; // silver, gold, bronze left-to-right
    const barWs = [220, 260, 220];
    const barHs = [140, 180, 110];
    const colors = ["#C0C0C0","#FFD700","#CD7F32"];
    const slotW = (width-outerPad*2-gutter)/3;
    const baseY = headerH+podiumH-20;
    order.forEach((teamIdx, slot)=>{
      const r = podiumRanks[teamIdx];
      if(!r) return;
      const cx = outerPad + gutter + slotW*slot + slotW/2;
      const isActChamp = isActualChampion(r.team.id);
      drawGoldPodiumTeam(ctx, cx, baseY, barWs[slot], barHs[slot], colors[slot], colors[slot], r.team, podiumLogos[teamIdx], r.totalPoints, isActChamp);
    });
    ctx.strokeStyle = "#3a2a00";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(outerPad+gutter, baseY+14);
    ctx.lineTo(width-outerPad, baseY+14);
    ctx.stroke();
  }

  /* ---- rest list, two columns ---- */
  const colW = (width - outerPad*2 - gutter - midGap)/2;
  const leftX = outerPad + gutter;
  const rightX = leftX + colW + midGap;
  const restY = headerH + podiumH + 20;

  function drawRestCol(x0, arr, logoArr){
    for(let i=0;i<arr.length;i++){
      const r = arr[i];
      const globalRank = restStart + (x0===leftX ? i : leftRest.length+i);
      const isActChamp = isActualChampion(r.team.id);
      const rowY = restY + i*rowH + rowH/2;
      ctx.save();
      ctx.translate(0, rowY);
      drawGoldRestRow(ctx, x0, colW, r, globalRank, logoArr[i], isActChamp);
      ctx.restore();
      ctx.strokeStyle = "#1f1500";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, restY+(i+1)*rowH-6);
      ctx.lineTo(x0+colW, restY+(i+1)*rowH-6);
      ctx.stroke();
    }
  }
  drawRestCol(leftX, leftRest, leftLogos2);
  drawRestCol(rightX, rightRest, rightLogos2);

  /* ---- footer ---- */
  const footY = restY + maxRestRows*rowH + 20;
  ctx.strokeStyle = "#3a2a00";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#5a4010";
    ctx.font = "700 14px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+34);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5a4010";
    ctx.fillText(dateLabel, outerPad, footY+36);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#3a2a00";
    ctx.fillText(pageLabel, width-outerPad, footY+36);
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
    ctx.fillStyle = "#5a4010";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalWs - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1200";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#7a6010";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}

/* ---- DESIGN: "Gold Luxury" — "Two Columns (6+6)" layout, capped at 6
   rows per column beyond the podium (12 teams per image). ---- */
export function renderGoldLuxuryTwoColSixDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  return renderGoldLuxuryDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos, 6);
}

/* ---- DESIGN: "Gold Luxury" — "One Column (12 Teams)" layout: podium for
   the top 3 on page 1, then a single-column list instead of the
   two-column split above. ---- */
export function renderGoldLuxuryOneColumnDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, startIndex, pageLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  startIndex = startIndex || 0;
  const rowsPerPage = PORTRAIT.on ? Infinity : 12; // portrait : toutes les équipes, hauteur variable
  const pageRanks = ranks.slice(0, rowsPerPage);
  const pageLogos = logos.slice(0, rowsPerPage);
  const showPodium = startIndex === 0;
  const podiumRanks = showPodium ? pageRanks.slice(0,3) : [];
  const podiumLogos = showPodium ? pageLogos.slice(0,3) : [];
  const restRanks = showPodium ? pageRanks.slice(3) : pageRanks.slice(0);
  const restLogos = showPodium ? pageLogos.slice(3) : pageLogos.slice(0);
  const restStart = showPodium ? 3 : startIndex;

  const baseWidth = PORTRAIT.on ? PORTRAIT.width : 1100;
  const outerPad = 48;
  const headerH = 150;
  const podiumH = showPodium ? 310 : 0;
  const rowH = 42;
  const footerH = 70 + (sponsorLogos.length ? 56 : 0);
  const restH = restRanks.length*rowH + 20;
  const photo = planPlayerPhoto(baseWidth, headerH, podiumH + restH, headerH-14, {left:8, overlap:12});
  const gutter = photo ? photo.gutter : 0;   // extra canvas width on the left for the player photo
  const width = PORTRAIT.on ? baseWidth : baseWidth + gutter;
  const height = headerH + podiumH + restH + footerH + 34;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0,0,width*0.4,height);
  bgGrad.addColorStop(0,"#1a1200");
  bgGrad.addColorStop(1,"#0a0800");
  roundRectPath(ctx, 0,0,width,height,16);
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.strokeStyle = "#7a6010";
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, 1,1,width-2,height-2,16);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#B8920A";
  ctx.font = "700 19px Georgia, serif";
  ctx.fillText("✦ ✦ ✦", width/2, 40);

  ctx.fillStyle = "#D4A017";
  ctx.font = "900 38px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width-180), width/2, 78);

  const seasonLabel = (EXPORT_TEXT.subtitle || "").toUpperCase();
  if(seasonLabel){
    ctx.fillStyle = "#7a6010";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(seasonLabel, width/2, 104);
  }

  if(champRush){
    ctx.font = "800 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#D4A017";
    drawIconTextLine(ctx, width/2, 128, [{icon:"crown"},{text:"CHAMPION RUSH"}], {iconSize:14});
  }

  {
    const bigLogoR = 32, bigLogoCx = outerPad+bigLogoR, bigLogoCy = 62;
    ctx.save();
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = "#1a1200";
    ctx.fill();
    ctx.clip();
    if(tourneyLogo){
      ctx.drawImage(tourneyLogo, bigLogoCx-bigLogoR, bigLogoCy-bigLogoR, bigLogoR*2, bigLogoR*2);
    }
    ctx.restore();
    ctx.strokeStyle = "#7a6010";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bigLogoCx, bigLogoCy, bigLogoR, 0, Math.PI*2);
    ctx.stroke();
  }

  drawPlayerPhoto(ctx, photo, [[outerPad+gutter, headerH, width-outerPad*2-gutter, podiumH + restH]]);
  if(showPodium && podiumRanks.length){
    const order = [1,0,2];
    const barWs = [170, 200, 170];
    const barHs = [120, 150, 96];
    const colors = ["#C0C0C0","#FFD700","#CD7F32"];
    const slotW = (width-outerPad*2-gutter)/3;
    const baseY = headerH+podiumH-16;
    order.forEach((teamIdx, slot)=>{
      const r = podiumRanks[teamIdx];
      if(!r) return;
      const cx = outerPad + gutter + slotW*slot + slotW/2;
      const isActChamp = isActualChampion(r.team.id);
      drawGoldPodiumTeam(ctx, cx, baseY, barWs[slot], barHs[slot], colors[slot], colors[slot], r.team, podiumLogos[teamIdx], r.totalPoints, isActChamp);
    });
    ctx.strokeStyle = "#3a2a00";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(outerPad+gutter, baseY+12);
    ctx.lineTo(width-outerPad, baseY+12);
    ctx.stroke();
  }

  const restY = headerH + podiumH + 18;
  const x0 = outerPad + gutter, colW = width - outerPad*2 - gutter;
  for(let i=0;i<restRanks.length;i++){
    const r = restRanks[i];
    const globalRank = restStart + i;
    const isActChamp = isActualChampion(r.team.id);
    const rowY = restY + i*rowH + rowH/2;
    ctx.save();
    ctx.translate(0, rowY);
    drawGoldRestRow(ctx, x0, colW, r, globalRank, restLogos[i], isActChamp);
    ctx.restore();
    ctx.strokeStyle = "#1f1500";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, restY+(i+1)*rowH-6);
    ctx.lineTo(x0+colW, restY+(i+1)*rowH-6);
    ctx.stroke();
  }

  const footY = restY + restRanks.length*rowH + 20;
  ctx.strokeStyle = "#3a2a00";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(outerPad, footY);
  ctx.lineTo(width-outerPad, footY);
  ctx.stroke();

  const tagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(tagline){
    ctx.textAlign = "center";
    ctx.fillStyle = "#5a4010";
    ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(tagline, width/2, footY+32);
  }

  const dateLabel = resultDateLabel || EXPORT_TEXT.date || "";
  if(dateLabel){
    ctx.textAlign = "left";
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5a4010";
    ctx.fillText(dateLabel, outerPad, footY+34);
  }
  if(pageLabel){
    ctx.textAlign = "right";
    ctx.font = "700 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#3a2a00";
    ctx.fillText(pageLabel, width-outerPad, footY+34);
  }

  if(sponsorLogos.length){
    const n = sponsorLogos.length;
    const sLogoR = n > 4 ? 17 : 22;
    const gap = 12;
    const sLogoCy = footY + 32 + 32;
    let sLogoCx = width - outerPad - sLogoR;
    const totalW2 = n*(sLogoR*2) + (n-1)*gap;
    ctx.textAlign = "right";
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#5a4010";
    ctx.fillText(n>1 ? "PARTNERS" : "PARTNER", width - outerPad - totalW2 - 12, sLogoCy + 4);
    for(let i=n-1;i>=0;i--){
      ctx.save();
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = "#1a1200";
      ctx.fill();
      ctx.clip();
      ctx.drawImage(sponsorLogos[i], sLogoCx-sLogoR, sLogoCy-sLogoR, sLogoR*2, sLogoR*2);
      ctx.restore();
      ctx.strokeStyle = "#7a6010";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sLogoCx, sLogoCy, sLogoR, 0, Math.PI*2);
      ctx.stroke();
      sLogoCx -= (sLogoR*2 + gap);
    }
  }

  return canvas;
}
