// @ts-nocheck
/* Portage du moteur d'export de résultats PHP (format-result/ff-tournament/
   assets/js/export) — code canvas d'origine conservé tel quel, seules les
   lectures de l'état global PHP passent par ../context. Généré puis
   relu : modifier ici directement, pas dans l'ancien projet PHP. */
import { EXPORT_TEXT, PORTRAIT, PHOTO } from "../context";

/* ====================================================================
   FLOATING DOWNLOAD RESULTS BUTTON
   Renders the current Final Standings as a shareable PNG graphic
   (drawn on a canvas — no external dependencies). Honors Champion
   Rush Mode by drawing glowing gold crowns next to qualifying teams.
==================================================================== */
export function loadImageAsync(src){
  return new Promise(resolve=>{
    if(!src){ resolve(null); return; }
    const img = new Image();
    img.onload = ()=> resolve(img);
    img.onerror = ()=> resolve(null);
    img.src = src;
  });
}

export function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

// Regular hexagon (flat sides left/right, points up/down) centered on cx,cy
// with "radius" r — used for the podium-style team badges.
export function hexPath(ctx, cx, cy, r){
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const angle = (Math.PI/3)*i - Math.PI/2;
    const x = cx + r*Math.cos(angle);
    const y = cy + r*Math.sin(angle);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
}

/* ---- Canvas-drawn icons for the exported PNG images. Mirrors the shapes
   in ICON_PATHS but rendered with the Canvas 2D API (no emoji font
   dependency, so the exported image looks the same on every machine). ---- */
export function drawCanvasIcon(ctx, name, cx, cy, size, color){
  ctx.save();
  ctx.translate(cx - size/2, cy - size/2);
  const s = size/24;
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.7/s;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  switch(name){
    case "trophy":
      ctx.beginPath();
      ctx.moveTo(7,3); ctx.lineTo(17,3); ctx.lineTo(16,12);
      ctx.quadraticCurveTo(16,16,12,16);
      ctx.quadraticCurveTo(8,16,8,12);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath(); ctx.arc(5.3,6,2.3,Math.PI*0.15,Math.PI*1.55); ctx.stroke();
      ctx.beginPath(); ctx.arc(18.7,6,2.3,Math.PI*1.45,Math.PI*2.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12,16); ctx.lineTo(12,19); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8.5,21); ctx.lineTo(15.5,21); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9,19); ctx.lineTo(15,19); ctx.stroke();
      break;
    case "crown":
      ctx.beginPath();
      ctx.moveTo(4,18); ctx.lineTo(20,18); ctx.lineTo(21.4,8.6);
      ctx.lineTo(16.2,12.2); ctx.lineTo(12,6); ctx.lineTo(7.8,12.2);
      ctx.lineTo(2.6,8.6); ctx.closePath();
      ctx.stroke();
      ctx.strokeRect(4,18,16,2.2);
      break;
    case "target":
      ctx.beginPath(); ctx.arc(12,12,8.5,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(12,12,5,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(12,12,1.6,0,Math.PI*2); ctx.fill();
      break;
    case "gamepad":
      roundRectPath(ctx,2.5,7,19,11,5.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7,10); ctx.lineTo(7,14); ctx.moveTo(5,12); ctx.lineTo(9,12); ctx.stroke();
      ctx.beginPath(); ctx.arc(15.5,10.7,1,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(18,13.2,1,0,Math.PI*2); ctx.fill();
      break;
    case "flag":
      ctx.beginPath(); ctx.moveTo(5,21); ctx.lineTo(5,3); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5,4);
      ctx.bezierCurveTo(7.6,2.5,10,2.5,12.5,4);
      ctx.bezierCurveTo(15,5.5,17.4,5.5,20,4);
      ctx.lineTo(20,13);
      ctx.bezierCurveTo(17.4,14.5,15,14.5,12.5,13);
      ctx.bezierCurveTo(10,11.5,7.6,11.5,5,13);
      ctx.closePath();
      ctx.stroke();
      break;
  }
  ctx.restore();
}

// Draws a centered line mixing icons and text — used for header labels like
// "[crown] CHAMPION RUSH" or "[trophy] BOOYAH!" so the exported image never
// depends on a system emoji font. `parts` is an array of
// {icon:'name', color} or {text:'STRING', color}; ctx.font/fillStyle set
// the default text style, iconSize defaults to ~85% of the font size.
export function drawIconTextLine(ctx, cx, y, parts, opts){
  opts = opts || {};
  const fontSizeMatch = /(\d+(?:\.\d+)?)px/.exec(ctx.font);
  const iconSize = opts.iconSize || (fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 14) * 0.9;
  const gap = opts.gap != null ? opts.gap : 5;
  const baseColor = ctx.fillStyle;
  const widths = parts.map(p => p.icon ? iconSize : ctx.measureText(p.text).width);
  const totalW = widths.reduce((a,b)=>a+b,0) + gap*(parts.length-1);
  let x;
  if(opts.align === "left") x = cx;
  else if(opts.align === "right") x = cx - totalW;
  else x = cx - totalW/2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  parts.forEach((p,i)=>{
    if(p.icon){
      drawCanvasIcon(ctx, p.icon, x+widths[i]/2, y-iconSize*0.38, iconSize, p.color||baseColor);
    }else{
      ctx.fillStyle = p.color||baseColor;
      ctx.fillText(p.text, x, y);
    }
    x += widths[i]+gap;
  });
  ctx.fillStyle = baseColor;
  ctx.textAlign = prevAlign;
}

// Shared header block (title / subtitle / final standings strip) used by every design.
export function drawResultsHeader(ctx, width, headerH, champRush, pageLabel){
  const bg = ctx.createLinearGradient(0,0,0,headerH+40);
  bg.addColorStop(0,"#11182a");
  bg.addColorStop(1,"#0a0e16");
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,width,headerH+40);

  const glow = ctx.createRadialGradient(width*0.18,0,0,width*0.18,0,260);
  glow.addColorStop(0,"rgba(46,204,113,0.20)");
  glow.addColorStop(1,"rgba(46,204,113,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,width,260);

  ctx.textAlign = "center";
  ctx.fillStyle = "#c7f08a";
  ctx.font = "800 26px Rajdhani, 'Segoe UI', sans-serif";
  ctx.fillText((EXPORT_TEXT.title||"FREE FIRE CHAMPIONSHIP").toUpperCase(), width/2, 50);

  ctx.fillStyle = "#9aa5bd";
  ctx.font = "600 13px Inter, 'Segoe UI', sans-serif";
  const sub = [EXPORT_TEXT.subtitle, EXPORT_TEXT.date].filter(Boolean).join("  •  ");
  if(sub) ctx.fillText(sub, width/2, 73);

  ctx.fillStyle = "#5d6982";
  ctx.font = "700 11px Inter, 'Segoe UI', sans-serif";
  if(champRush){
    drawIconTextLine(ctx, width/2, 96, [{text:"FINAL STANDINGS   •   "},{icon:"crown"},{text:" CHAMPION RUSH"}]);
  }else{
    ctx.fillText("FINAL STANDINGS", width/2, 96);
  }

  const lineGrad = ctx.createLinearGradient(60,0,width-60,0);
  lineGrad.addColorStop(0,"#2ecc71");
  lineGrad.addColorStop(1,"#8fd331");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(60, 110, width-120, 3);
}

/* ====================================================================
   PLAYER PHOTO ON EXPORTED RESULT IMAGES
   Settings → Player Photo used to show on the on-screen Results page
   only; the canvas-drawn PNG exports never drew it. downloadResultsImage()
   decodes the photo once into RESULT_PLAYER_PHOTO, then a design that
   supports it calls:
     1. planPlayerPhoto()  — BEFORE it creates its canvas. Returns the photo
        size/position and the extra left "gutter" width the canvas needs so
        the player stands beside the table instead of hiding behind it.
        Returns null when there's no photo (design renders exactly as before).
     2. drawPlayerPhoto()  — after the background, before the table. Full
        strength outside the table, see-through underneath it.
     3. playerPhotoOverRect() — optional, for designs whose rows / header
        bar are opaque: re-draws the photo faintly on top of that shape
        (call it right after filling the shape, before its text).
==================================================================== */

export const PLAYER_PHOTO_SEE_THROUGH = 0.42; // photo opacity where it passes under table rows

// Cutout PNGs exported from background-removal tools usually carry a lot of
// transparent padding, which made the player look tiny once scaled to fit.
// Crops the image to the pixels that are actually visible. Fully opaque
// images (JPG etc.) are returned untouched.
export function trimTransparentPadding(img){
  if(!img) return img;
  try{
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if(!iw || !ih) return img;
    const k = Math.min(1, 1600 / Math.max(iw, ih));            // work on a capped copy for speed
    const cw = Math.max(1, Math.round(iw * k)), ch = Math.max(1, Math.round(ih * k));
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0, cw, ch);
    const data = cx.getImageData(0, 0, cw, ch).data;
    let minX = cw, minY = ch, maxX = -1, maxY = -1;
    for(let y = 0; y < ch; y++){
      for(let x = 0; x < cw; x++){
        if(data[(y * cw + x) * 4 + 3] > 16){
          if(x < minX) minX = x; if(x > maxX) maxX = x;
          if(y < minY) minY = y; if(y > maxY) maxY = y;
        }
      }
    }
    if(maxX < 0) return img;                                    // nothing visible
    if(minX <= 1 && minY <= 1 && maxX >= cw - 2 && maxY >= ch - 2) return img; // no padding
    const pad = 2;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(cw - 1, maxX + pad); maxY = Math.min(ch - 1, maxY + pad);
    const sx = minX / k, sy = minY / k, sw = (maxX - minX + 1) / k, sh = (maxY - minY + 1) / k;
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(sw)); out.height = Math.max(1, Math.round(sh));
    out.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    return out;
  }catch(e){
    return img;
  }
}

export function planPlayerPhoto(baseWidth, tableTop, tableH, topLimit, opts){
  const img = PHOTO.img;
  if(!img) return null;
  opts = opts || {};
  const left = opts.left || 0;                                    // inset from the canvas edge (framed / card themes)
  const overlap = opts.overlap != null ? opts.overlap : 70;       // px of the photo allowed to sit under the table's first column
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if(!iw || !ih) return null;
  const bottom = tableTop + tableH + 12;      // stands just below the last row
  // Use all the height beside the table (up to just under the title area),
  // limited only by a maximum width so wide photos don't swallow the image.
  let h = bottom - topLimit;
  let w = h * iw / ih;
  // Portrait (1000px de large, hauteur variable) : la photo peut monter à la
  // moitié de la largeur — sinon, sur une image haute, elle paraît minuscule.
  const maxW = baseWidth * (PORTRAIT.on ? 0.5 : baseWidth < 1300 ? 0.34 : 0.26); // one-column images are narrower, so allow a relatively wider photo
  if(w > maxW){ w = maxW; h = w * ih / iw; }
  if(h < 120) return null;
  // En portrait, ~55% de la photo passe sous le tableau (en transparence, voir
  // drawPlayerPhoto) pour ne pas trop rétrécir les colonnes sur 1000px.
  const effectiveOverlap = PORTRAIT.on ? Math.max(overlap, Math.round(w * 0.55)) : overlap;
  // The table starts ~44px in from the gutter, so subtract that too: what's left is the overlap.
  return { img: img, x: left, y: bottom - h, w: w, h: h, gutter: Math.max(0, Math.round(left + w - 44 - effectiveOverlap)) };
}

export function drawPlayerPhoto(ctx, photo, tableRects){
  if(!photo) return;
  tableRects = tableRects || [];
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // outside the table: full strength
  ctx.beginPath();
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  tableRects.forEach(function(r){ ctx.rect(r[0], r[1], r[2], r[3]); });
  ctx.clip("evenodd");
  ctx.drawImage(photo.img, photo.x, photo.y, photo.w, photo.h);
  ctx.restore();
  // under the table: faint, so rows and text stay readable
  if(tableRects.length){
    ctx.save();
    ctx.imageSmoothingQuality = "high";
    ctx.beginPath();
    tableRects.forEach(function(r){ ctx.rect(r[0], r[1], r[2], r[3]); });
    ctx.clip();
    ctx.globalAlpha = PLAYER_PHOTO_SEE_THROUGH;
    ctx.drawImage(photo.img, photo.x, photo.y, photo.w, photo.h);
    ctx.restore();
  }
}

export function playerPhotoOverRect(ctx, photo, x, y, w, h, radius){
  if(!photo) return;
  if(x >= photo.x + photo.w || y + h <= photo.y || y >= photo.y + photo.h) return; // no overlap
  ctx.save();
  ctx.imageSmoothingQuality = "high";
  if(radius){ roundRectPath(ctx, x, y, w, h, radius); }
  else{ ctx.beginPath(); ctx.rect(x, y, w, h); }
  ctx.clip();
  ctx.globalAlpha = PLAYER_PHOTO_SEE_THROUGH;
  ctx.drawImage(photo.img, photo.x, photo.y, photo.w, photo.h);
  ctx.restore();
}
