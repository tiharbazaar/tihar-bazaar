
(async function() {
  const images = window.PRODUCT_IMAGES;
  const names = Object.keys(images);
  console.log("Starting update for " + names.length + " products");
  
  let updated = 0, notFound = 0, errors = 0;
  
  // Get all products once
  const snap = await db.collection("products").get();
  const products = snap.docs.map(d => ({ id: d.id, name: (d.data().name||"").trim(), ref: d.ref }));
  console.log("Found " + products.length + " products in Firestore");
  
  // Build name -> product map
  const prodMap = {};
  products.forEach(p => { prodMap[p.name] = p; });
  
  // Update in batches of 100
  const batchSize = 100;
  for (let i = 0; i < names.length; i += batchSize) {
    const batch = db.batch();
    let batchCount = 0;
    const chunk = names.slice(i, i + batchSize);
    
    for (const name of chunk) {
      const prod = prodMap[name];
      if (prod) {
        batch.update(prod.ref, { image: images[name], updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        batchCount++;
        updated++;
      } else {
        notFound++;
      }
    }
    
    if (batchCount > 0) {
      try {
        await batch.commit();
        console.log("Batch " + (i/batchSize+1) + " committed: " + batchCount + " updated");
      } catch(e) {
        console.error("Batch failed:", e);
        errors += batchCount;
      }
    }
    
    // Progress
    if (i % 300 === 0) {
      console.log("Progress: " + i + "/" + names.length);
    }
  }
  
  console.log("DONE! Updated: " + updated + ", Not found: " + notFound + ", Errors: " + errors);
  return { updated, notFound, errors };
})();
