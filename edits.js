// For ArrowRight handler (around line 214-224):
if (titleEl) {
  const title = titleEl.textContent?.toLowerCase() || '';
  if (title.includes('setup') || title.includes('einstieg')) {
    currentBlockType = 'setup';
  } else if (title.includes('trend')) {
    currentBlockType = 'trends';
  } else if (title.includes('position') || title.includes('struktur')) {
    currentBlockType = 'position';
  } else if (title.includes('marktzonen')) {
    currentBlockType = 'marktzonen';
  } else if (title.includes('ergebnis')) {
    currentBlockType = 'ergebnis';
  } else if (title.includes('risk') || title.includes('reward') || title.includes('r/r')) {
    currentBlockType = 'risk';
  }
}

// For ArrowLeft handler (around line 293-303):
if (titleEl) {
  const title = titleEl.textContent?.toLowerCase() || '';
  if (title.includes('setup') || title.includes('einstieg')) {
    currentBlockType = 'setup';
  } else if (title.includes('trend')) {
    currentBlockType = 'trends';
  } else if (title.includes('position') || title.includes('struktur')) {
    currentBlockType = 'position';
  } else if (title.includes('marktzonen')) {
    currentBlockType = 'marktzonen';
  } else if (title.includes('ergebnis')) {
    currentBlockType = 'ergebnis';
  } else if (title.includes('risk') || title.includes('reward') || title.includes('r/r')) {
    currentBlockType = 'risk';
  }
}