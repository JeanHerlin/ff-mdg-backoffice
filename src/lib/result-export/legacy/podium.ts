// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, isChampionTeam, isActualChampion } from "../context";
import { drawCanvasIcon, drawIconTextLine, hexPath, roundRectPath } from "./canvas-utils";

/* ---- DESIGN: "Rank Table" — official two-column FREE FIRE rank table.
   Every result-table download now uses this layout. It shows up to 18 teams
   per image (two columns of up to 9 rows each). All text — tournament name,
   season, team names, and every stat column — is pulled live from state, so
   the whole table is fully editable simply by editing that data. ---- */
export function fitCanvasText(ctx, text, maxWidth){
  text = String(text==null ? "" : text);
  if(ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while(out.length>1 && ctx.measureText(out+"…").width > maxWidth){
    out = out.slice(0,-1);
  }
  return out+"…";
}

/* ---- shared podium-card drawer used by both "Podium Card" and "Web App
   Mockup" designs below. Draws the trophy header + top-3 hexagon podium +
   decorative action-button row inside the rectangle (x,y,w,h). Only the
   top 3 teams by points are shown — this is a highlight card, not a full
   standings table. ---- */
export function drawPodiumBlock(ctx, x, y, w, ranks, logos, tourneyLogo, accent){
  accent = accent || "#8fd331";
  const cx = x + w/2;

  // big tournament logo, top-left
  const brandLogoR = 46, brandLogoCx = x+brandLogoR+4, brandLogoCy = y+brandLogoR+4;
  ctx.save();
  ctx.beginPath();
  ctx.arc(brandLogoCx, brandLogoCy, brandLogoR, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = "#12161f";
  ctx.fill();
  ctx.clip();
  if(tourneyLogo){
    ctx.drawImage(tourneyLogo, brandLogoCx-brandLogoR, brandLogoCy-brandLogoR, brandLogoR*2, brandLogoR*2);
  }
  ctx.restore();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(brandLogoCx, brandLogoCy, brandLogoR, 0, Math.PI*2);
  ctx.stroke();

  // FREE FIRE brand + tagline, top-right (mirrors the logo on the left)
  ctx.textAlign = "right";
  ctx.font = "italic 900 18px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("FREE FIRE", x+w, y+18);
  const podiumBrandTagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(podiumBrandTagline){
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(podiumBrandTagline, x+w, y+32);
  }

  // trophy + laurel
  drawCanvasIcon(ctx, "trophy", cx, y+34, 42, accent);
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.arc(cx-46, y+34, 22, Math.PI*0.15, Math.PI*1.15, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx+46, y+34, 22, Math.PI*1.85, Math.PI*0.85, true);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "800 15px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText("TOURNAMENT CHAMPIONS", cx, y+90);

  ctx.font = "800 42px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  const title = fitCanvasText(ctx, (EXPORT_TEXT.title||"TOURNAMENT").toUpperCase(), w-120);
  ctx.fillText(title, cx, y+136);
  const titleW = ctx.measureText(title).width;
  ctx.strokeStyle = "rgba(143,211,49,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx-titleW/2-70, y+130); ctx.lineTo(cx-titleW/2-16, y+130); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx+titleW/2+16, y+130); ctx.lineTo(cx+titleW/2+70, y+130); ctx.stroke();

  // --- top-3 podium cards ---
  const top3 = ranks.slice(0,3);
  const top3Logos = logos.slice(0,3);
  const order = [1,0,2]; // visual slot order: 2nd (left), 1st (center), 3rd (right)
  // Indexed by SLOT (not by data rank i) since the arrays below are already
  // written in that same left/center/right visual order.
  const placeTags = ["2ND PLACE","1ST PLACE","3RD PLACE"];
  const placeColors = ["#c9d2e0","#8fd331","#73c33e"];
  const cardW = 210, cardGap = 22;
  const rowTop = y + 206; // extra breathing room below the tournament title
  const startX = cx - (cardW*3 + cardGap*2)/2;

  order.forEach((i, slot)=>{
    const r = top3[i];
    if(!r) return;
    const color = placeColors[slot];
    const isFirst = i===0;
    const cardH = isFirst ? 250 : 224;
    const cardX = startX + slot*(cardW+cardGap);
    const cardY = isFirst ? rowTop-18 : rowTop;

    if(isFirst){
      ctx.save();
      ctx.shadowColor = "rgba(143,211,49,0.45)";
      ctx.shadowBlur = 26;
      roundRectPath(ctx, cardX, cardY, cardW, cardH, 14);
      ctx.fillStyle = "rgba(20,16,4,0.9)";
      ctx.fill();
      ctx.restore();
    }
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 14);
    ctx.fillStyle = isFirst ? "rgba(143,211,49,0.08)" : "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.lineWidth = isFirst ? 2 : 1.4;
    ctx.strokeStyle = color;
    roundRectPath(ctx, cardX, cardY, cardW, cardH, 14);
    ctx.stroke();

    // place tag pill
    ctx.font = "800 11px Inter, 'Segoe UI', sans-serif";
    const tagLabel = placeTags[slot];
    const tagW = ctx.measureText(tagLabel).width + 24;
    roundRectPath(ctx, cardX+cardW/2-tagW/2, cardY-14, tagW, 26, 13);
    ctx.fillStyle = isFirst ? "#8fd331" : "#1c2231";
    ctx.fill();
    ctx.fillStyle = isFirst ? "#1a1400" : "#c9d2e0";
    ctx.textAlign = "center";
    ctx.fillText(tagLabel, cardX+cardW/2, cardY+3);

    // hexagon team logo
    const hexCx = cardX+cardW/2, hexCy = cardY+70, hexR = isFirst ? 52 : 44;
    ctx.save();
    hexPath(ctx, hexCx, hexCy, hexR);
    ctx.fillStyle = "#12161f";
    ctx.fill();
    ctx.clip();
    const img = top3Logos[i];
    if(img){
      ctx.drawImage(img, hexCx-hexR, hexCy-hexR, hexR*2, hexR*2);
    }else{
      ctx.fillStyle = color;
      ctx.font = `800 ${hexR}px Rajdhani, 'Segoe UI', sans-serif`;
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), hexCx, hexCy+hexR*0.35);
    }
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    hexPath(ctx, hexCx, hexCy, hexR);
    ctx.stroke();

    // team name
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${isFirst?20:17}px Rajdhani, 'Segoe UI', sans-serif`;
    ctx.fillText(fitCanvasText(ctx, r.team.name, cardW-24), cardX+cardW/2, cardY+cardH-56);

    // points pill
    ctx.font = "800 16px Rajdhani, 'Segoe UI', sans-serif";
    const ptsLabel = `${r.totalPoints} PTS`;
    const ptsW = ctx.measureText(ptsLabel).width + 30;
    roundRectPath(ctx, cardX+cardW/2-ptsW/2, cardY+cardH-40, ptsW, 32, 8);
    ctx.fillStyle = isFirst ? "#8fd331" : "#171c28";
    ctx.fill();
    ctx.fillStyle = isFirst ? "#1a1400" : "#c7f08a";
    ctx.fillText(ptsLabel, cardX+cardW/2, cardY+cardH-18);
  });

  const podiumBottom = rowTop + 224 + 20;

  // No action buttons are rendered in exported images.
  // The web-app actions (Download / View Full Standings / Generate Report)
  // belong to the live page only and must never appear in the PNG export.
  return podiumBottom; // bottom edge used by callers
}

/* ---- DESIGN: "Podium Card" — a standalone dark/gold card highlighting
   just the top 3 teams (hexagon badges, place pills, points), matching the
   trophy-podium look rather than a full standings table. ---- */
export function renderPodiumCardDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  const width = 900, pad = 40;
  const height = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0,0,width,height);

  roundRectPath(ctx, pad/2, pad/2, width-pad, height-pad, 20);
  ctx.save();
  ctx.shadowColor = "rgba(143,211,49,0.35)";
  ctx.shadowBlur = 22;
  ctx.strokeStyle = "#8fd331";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  drawPodiumBlock(ctx, pad, 46, width-pad*2, ranks, logos, tourneyLogo, "#8fd331");

  return canvas;
}

/* ---- DESIGN: "Web App Mockup" — the same podium card embedded inside a
   dashboard-style frame (sidebar nav + top bar + footer) so the exported
   image reads as an in-app screenshot rather than a bare graphic. ---- */
export function renderWebAppDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, sponsorLogos){
  sponsorLogos = sponsorLogos || [];
  const width = 1536, sidebarW = 260, topbarH = 76, footerH = 60;
  const height = 1040;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");

  // page background
  ctx.fillStyle = "#0a0e16";
  ctx.fillRect(0,0,width,height);

  // ---- sidebar ----
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0,0,sidebarW,height);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sidebarW,0); ctx.lineTo(sidebarW,height); ctx.stroke();

  // brand
  const brandCx = 46, brandCy = 44, brandR = 20;
  ctx.save();
  ctx.beginPath(); ctx.arc(brandCx,brandCy,brandR,0,Math.PI*2); ctx.closePath();
  ctx.fillStyle="#1c2231"; ctx.fill(); ctx.clip();
  if(tourneyLogo) ctx.drawImage(tourneyLogo, brandCx-brandR, brandCy-brandR, brandR*2, brandR*2);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.font = "800 17px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitCanvasText(ctx,(EXPORT_TEXT.title||"TOURNAMENT").toUpperCase(), sidebarW-96), brandCx+brandR+12, brandCy-1);
  ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#75e06f";
  ctx.fillText("ESPORTS", brandCx+brandR+12, brandCy+15);

  const navItems = [
    {label:"Home"}, {label:"Tournaments", active:true}, {label:"Matches"},
    {label:"Teams"}, {label:"Schedule"}, {label:"Leaderboard"}, {label:"News"}
  ];
  let navY = 100;
  navItems.forEach(item=>{
    if(item.active){
      roundRectPath(ctx, 14, navY-8, sidebarW-28, 40, 8);
      ctx.fillStyle = "rgba(61,220,151,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(61,220,151,0.4)";
      ctx.lineWidth = 1;
      roundRectPath(ctx, 14, navY-8, sidebarW-28, 40, 8);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(38, navY+12, 4, 0, Math.PI*2);
    ctx.fillStyle = item.active ? "#75e06f" : "#5d6982";
    ctx.fill();
    ctx.font = "700 13.5px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = item.active ? "#75e06f" : "#9aa5bd";
    ctx.fillText(item.label, 56, navY+16);
    navY += 46;
  });

  navY += 14;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.moveTo(20,navY); ctx.lineTo(sidebarW-20,navY); ctx.stroke();
  navY += 28;
  ctx.font = "800 10px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#75e06f";
  ctx.fillText("MY SPACE", 24, navY);
  navY += 34;
  ["My Team","My Matches","Profile","Settings"].forEach(label=>{
    ctx.beginPath();
    ctx.arc(38, navY+12, 4, 0, Math.PI*2);
    ctx.fillStyle = "#5d6982";
    ctx.fill();
    ctx.font = "700 13.5px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#9aa5bd";
    ctx.fillText(label, 56, navY+16);
    navY += 42;
  });

  // follow us block, pinned near the bottom of the sidebar
  const followY = height - 110;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.moveTo(20,followY-24); ctx.lineTo(sidebarW-20,followY-24); ctx.stroke();
  ctx.font = "800 10px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#75e06f";
  ctx.fillText("FOLLOW US", 24, followY);
  for(let i=0;i<4;i++){
    const scx = 40 + i*46, scy = followY + 34;
    ctx.beginPath();
    ctx.arc(scx, scy, 17, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // ---- topbar ----
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath(); ctx.moveTo(sidebarW,topbarH); ctx.lineTo(width,topbarH); ctx.stroke();

  // hamburger
  ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 2.4; ctx.lineCap="round";
  [0,8,16].forEach(dy=>{
    ctx.beginPath(); ctx.moveTo(sidebarW+40, 32+dy); ctx.lineTo(sidebarW+70, 32+dy); ctx.stroke();
  });

  // bell + badge
  const bellCx = width-160, bellCy = topbarH/2;
  ctx.beginPath();
  ctx.arc(bellCx, bellCy, 14, 0, Math.PI*2);
  ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bellCx+11, bellCy-11, 8, 0, Math.PI*2);
  ctx.fillStyle = "#75e06f";
  ctx.fill();

  // avatar + name
  const avCx = width-64, avCy = topbarH/2, avR = 18;
  ctx.save();
  ctx.beginPath(); ctx.arc(avCx,avCy,avR,0,Math.PI*2); ctx.closePath();
  ctx.fillStyle="#1c2231"; ctx.fill(); ctx.clip();
  ctx.fillStyle="#75e06f";
  ctx.font=`800 ${avR}px Rajdhani, sans-serif`;
  ctx.textAlign="center";
  ctx.fillText("A", avCx, avCy+avR*0.35);
  ctx.restore();
  ctx.strokeStyle = "rgba(61,220,151,0.6)"; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.arc(avCx,avCy,avR,0,Math.PI*2); ctx.stroke();

  // ---- main content ----
  const contentX = sidebarW, contentW = width-sidebarW;
  ctx.textAlign = "left";
  ctx.font = "700 13px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#75e06f";
  drawIconTextLine(ctx, contentX+40, topbarH+50, [{icon:"flag",color:"#75e06f"},{text:"BACK TO TOURNAMENT",color:"#75e06f"}], {align:"left", iconSize:14});

  drawPodiumBlock(ctx, contentX+ (contentW-900)/2 + 40, topbarH+70, 900-80, ranks, logos, tourneyLogo, "#8fd331");

  // ---- footer: replaced with a partner-logo slot instead of the site's
  // copyright/nav links, so sponsors get the space instead. ----
  const footY = height-footerH;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.moveTo(sidebarW,footY); ctx.lineTo(width,footY); ctx.stroke();
  ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#5d6982";
  ctx.textAlign = "left";
  ctx.fillText("PARTNER", contentX+40, footY+footerH/2+4);

  if(sponsorLogos.length){
    const logoH = footerH - 20, gap = 22;
    let lx = width - 40;
    for(let i=sponsorLogos.length-1;i>=0;i--){
      const img = sponsorLogos[i];
      const ratio = img.width && img.height ? img.width/img.height : 1;
      const lw = logoH*ratio;
      lx -= lw;
      ctx.drawImage(img, lx, footY+10, lw, logoH);
      lx -= gap;
    }
  }else{
    // Empty upload placeholder box so it's obvious where a logo can go.
    const boxW = 200, boxH = footerH-20;
    const boxX = width-40-boxW, boxY = footY+10;
    ctx.setLineDash([6,5]);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.4;
    roundRectPath(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.textAlign = "center";
    ctx.fillText("UPLOAD PARTNER LOGO", boxX+boxW/2, boxY+boxH/2+4);
  }

  return canvas;
}

/* ---- DESIGN: "Current Page Design" — recreates the actual Final Results
   page (the .results-hero / .podium-final block shown on-screen) rather
   than a standalone card or an app-shell mockup: same dark green gradient
   hero panel, brand mark, trophy + eyebrow + tournament title + meta line,
   and the exact 2nd/1st/3rd podium-column layout with rounded-square logo
   boxes, place-tag pills and points, colored to match the live page. ---- */
export function renderCurrentPageDesign(ranks, logos, champRush, tourneyLogo, resultDateLabel, sponsorLogos){
  const width = 1000;
  const padX = 34, padBottom = 32;
  const top3 = ranks.slice(0,3);
  const top3Logos = logos.slice(0,3);
  const hasFirst = !!top3[0];
  const podiumTop = 236; // space used by brand/trophy/eyebrow/title/meta above the podium row
  const podH = hasFirst ? 390 : 330;
  const height = podiumTop + podH + padBottom + 20;

  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");

  // page background behind the hero panel, matching the app's own dark bg
  ctx.fillStyle = "#0a0e16";
  ctx.fillRect(0,0,width,height);

  // ---- .results-hero panel ----
  const heroX = 10, heroY = 10, heroW = width-20, heroH = height-20;
  roundRectPath(ctx, heroX, heroY, heroW, heroH, 14);
  const grad = ctx.createLinearGradient(heroX, heroY, heroX+heroW*0.3, heroY+heroH);
  grad.addColorStop(0, "#061108");
  grad.addColorStop(0.45, "#071b0c");
  grad.addColorStop(1, "#041008");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(122,210,46,.72)";
  ctx.lineWidth = 1.4;
  roundRectPath(ctx, heroX, heroY, heroW, heroH, 14);
  ctx.stroke();
  // inner hairline border, mirrors .results-hero:before
  ctx.strokeStyle = "rgba(126,220,43,.28)";
  ctx.lineWidth = 1;
  roundRectPath(ctx, heroX+10, heroY+10, heroW-20, heroH-20, 10);
  ctx.stroke();

  // big tournament logo, top-left
  const brandLogoR = 46, brandLogoCx = heroX+34+brandLogoR, brandLogoCy = heroY+34+brandLogoR-10;
  ctx.save();
  ctx.beginPath();
  ctx.arc(brandLogoCx, brandLogoCy, brandLogoR, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = "#07130a";
  ctx.fill();
  ctx.clip();
  if(tourneyLogo){
    ctx.drawImage(tourneyLogo, brandLogoCx-brandLogoR, brandLogoCy-brandLogoR, brandLogoR*2, brandLogoR*2);
  }
  ctx.restore();
  ctx.strokeStyle = "#8fdf38";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(brandLogoCx, brandLogoCy, brandLogoR, 0, Math.PI*2);
  ctx.stroke();

  // brand mark, moved to top-right
  ctx.textAlign = "right";
  ctx.font = "italic 900 18px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#f5f7f5";
  ctx.fillText("FREE FIRE", heroX+heroW-34, heroY+38);
  const brandTagline = (EXPORT_TEXT.slogan || "").toUpperCase();
  if(brandTagline){
    ctx.font = "700 10px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#8fdf38";
    ctx.fillText(brandTagline, heroX+heroW-34, heroY+52);
  }

  // trophy + eyebrow + title + meta, centered
  const cx = width/2;
  ctx.textAlign = "center";
  drawCanvasIcon(ctx, "trophy", cx, heroY+58, 40, "#91df38");

  ctx.font = "800 12px Inter, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#8fdf38";
  ctx.fillText("TOURNAMENT CHAMPIONS", cx, heroY+100);

  ctx.font = "800 34px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#f7faf7";
  ctx.fillText(fitCanvasText(ctx, (EXPORT_TEXT.title||"TOURNAMENT").toUpperCase(), heroW-100), cx, heroY+136);

  const metaParts = [];
  if(EXPORT_TEXT.date) metaParts.push(EXPORT_TEXT.date);
  if(EXPORT_TEXT.matchCount) metaParts.push(`${EXPORT_TEXT.matchCount} Matches Played`);
  if(metaParts.length){
    ctx.font = "600 12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#d8e1d9";
    ctx.fillText(metaParts.join("   •   "), cx, heroY+160);
  }

  // ---- .podium-final: 2nd / 1st / 3rd columns ----
  const order = [1,0,2]; // display order: silver, gold, bronze
  const placeTags = ["1ST PLACE","2ND PLACE","3RD PLACE"];
  const accents = {
    1:{border:"#82b6a0", tagBorder:"rgba(130,182,160,.5)", tagBg:"rgba(130,182,160,.08)", logoBorder:"rgba(136,170,156,1)", pts:"#d7e7df"},
    0:{border:"#a0ed3e", tagBorder:"rgba(126,220,43,.45)", tagBg:"rgba(80,153,33,.22)", logoBorder:"#c0f15c", pts:"#93e33b"},
    2:{border:"#9e743f", tagBorder:"rgba(158,116,63,.55)", tagBg:"rgba(158,116,63,.08)", logoBorder:"#b57940", pts:"#d99a5e"}
  };
  const gap = 22;
  const colW = (heroW - padX*2 - gap*2) / 3;
  const rowBottom = heroY + heroH - padBottom;

  order.forEach((i, slot)=>{
    const r = top3[i];
    const colX = heroX + padX + slot*(colW+gap);
    const isFirst = i===0;
    const colH = isFirst ? podH : podH-46;
    const colY = rowBottom - colH;
    const acc = accents[i];
    const isGlowing = r && isChampionTeam(r.totalPoints);
    const isChampion = r && isActualChampion(r.team.id);

    if(!r){
      roundRectPath(ctx, colX, colY, colW, colH, 13);
      ctx.strokeStyle = "rgba(92,175,38,.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }

    // glow for Champion Rush "in line" / actual champion teams
    ctx.save();
    if(isGlowing || isChampion){
      ctx.shadowColor = "rgba(143,211,49,.5)";
      ctx.shadowBlur = 24;
    }
    roundRectPath(ctx, colX, colY, colW, colH, 13);
    if(isFirst){
      const cardGrad = ctx.createLinearGradient(colX, colY, colX, colY+colH);
      cardGrad.addColorStop(0, "rgba(108,203,43,.11)");
      cardGrad.addColorStop(1, "rgba(4,17,8,.82)");
      ctx.fillStyle = cardGrad;
    }else{
      ctx.fillStyle = "rgba(4,17,8,.72)";
    }
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = (isGlowing||isChampion) ? "#8fd331" : acc.border;
    ctx.lineWidth = isFirst ? 2 : 1.4;
    roundRectPath(ctx, colX, colY, colW, colH, 13);
    ctx.stroke();

    if(isFirst){
      ctx.strokeStyle = "#9bea3b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(colX+colW*0.15, colY); ctx.lineTo(colX+colW*0.85, colY);
      ctx.stroke();
    }

    let cy = colY + 34;

    // place-tag pill
    ctx.font = "800 12px Inter, 'Segoe UI', sans-serif";
    const tagLabel = placeTags[i];
    const tagW = ctx.measureText(tagLabel).width + 48;
    roundRectPath(ctx, colX+colW/2-tagW/2, cy-16, tagW, 30, 7);
    ctx.fillStyle = acc.tagBg;
    ctx.fill();
    ctx.strokeStyle = acc.tagBorder;
    ctx.lineWidth = 1;
    roundRectPath(ctx, colX+colW/2-tagW/2, cy-16, tagW, 30, 7);
    ctx.stroke();
    ctx.fillStyle = "#eaf1eb";
    ctx.fillText(tagLabel, colX+colW/2, cy+4);
    cy += 46;

    // champion crown + ribbon, actual champions only
    if(isChampion){
      drawCanvasIcon(ctx, "trophy", colX+colW/2, colY+16, 20, "#9bea3b");
      ctx.save();
      ctx.translate(colX+colW-26, colY+30);
      ctx.rotate(40*Math.PI/180);
      ctx.font = "800 10px Rajdhani, 'Segoe UI', sans-serif";
      roundRectPath(ctx, -58,-9,116,18,3);
      ctx.fillStyle = "#1f9d55";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("CHAMPION", 0, 4);
      ctx.restore();
      ctx.textAlign = "center";
    }

    // rounded-square logo box
    const logoSize = isFirst ? 108 : 92;
    const logoX = colX+colW/2-logoSize/2, logoY = cy;
    ctx.save();
    roundRectPath(ctx, logoX, logoY, logoSize, logoSize, 16);
    ctx.fillStyle = "#07130a";
    ctx.fill();
    ctx.clip();
    const img = top3Logos[i];
    if(img){
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
    }else{
      ctx.fillStyle = acc.border;
      ctx.font = `900 ${logoSize*0.42}px Rajdhani, 'Segoe UI', sans-serif`;
      ctx.fillText((r.team.name||"?").charAt(0).toUpperCase(), colX+colW/2, logoY+logoSize/2+logoSize*0.15);
    }
    ctx.restore();
    ctx.strokeStyle = acc.logoBorder;
    ctx.lineWidth = isFirst ? 2.2 : 1.6;
    roundRectPath(ctx, logoX, logoY, logoSize, logoSize, 16);
    ctx.stroke();
    cy += logoSize + 22;

    // team name
    ctx.font = `900 ${isFirst?20:18}px Rajdhani, 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#f7faf7";
    ctx.fillText(fitCanvasText(ctx, r.team.name, colW-24), colX+colW/2, cy);
    cy += 30;

    // points
    ctx.font = `900 ${isFirst?23:20}px Rajdhani, 'Segoe UI', sans-serif`;
    ctx.fillStyle = acc.pts;
    ctx.fillText(`${r.totalPoints} PTS`, colX+colW/2, cy);
  });

  return canvas;
}
