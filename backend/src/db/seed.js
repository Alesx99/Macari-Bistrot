import db, { initSchema } from './index.js';

/**
 * Popola il database con piatti di esempio della tradizione pugliese,
 * coerenti con l'identità di un bistrot italiano.
 * Eseguito solo se la tabella menu_items è vuota.
 */
function seed() {
  initSchema();

  const count = db.prepare('SELECT COUNT(*) AS n FROM menu_items').get().n;
  if (count > 0) {
    console.log(`[seed] Database già popolato (${count} piatti). Nessuna azione.`);
    return;
  }

  const items = [
    // Antipasti
    { section: 'Antipasti', title: 'Burrata di Andria',
      description: 'Burrata fresca su letto di pomodorini confit e basilico',
      price: 9.50 },
    { section: 'Antipasti', title: 'Tagliere del Bistrot',
      description: 'Selezione di salumi e formaggi pugliesi con confetture artigianali',
      price: 14.00 },
    { section: 'Antipasti', title: 'Polpo arrosto',
      description: 'Polpo cotto a bassa temperatura, crema di patate e olive taggiasche',
      price: 12.00 },

    // Primi
    { section: 'Primi', title: 'Orecchiette alle cime di rapa',
      description: 'Pasta fresca fatta in casa, cime di rapa, acciughe e mollica croccante',
      price: 11.00 },
    { section: 'Primi', title: 'Spaghetti alle vongole',
      description: 'Spaghetti di grano duro con vongole veraci, aglio, prezzemolo e bottarga',
      price: 14.00 },
    { section: 'Primi', title: 'Risotto al limone e gamberi',
      description: 'Riso Carnaroli mantecato al limone di Sorrento con tartare di gamberi rossi',
      price: 15.00 },

    // Secondi
    { section: 'Secondi', title: 'Tagliata di manzo',
      description: 'Controfiletto di manzo podolico, rucola, scaglie di grana e riduzione al Primitivo',
      price: 22.00 },
    { section: 'Secondi', title: 'Branzino in crosta di sale',
      description: 'Branzino dell\'Adriatico cotto in crosta, patate al rosmarino',
      price: 24.00 },
    { section: 'Secondi', title: 'Parmigiana di melanzane',
      description: 'Melanzane fritte, pomodoro San Marzano, mozzarella di bufala e basilico',
      price: 13.00 },

    // Dolci
    { section: 'Dolci', title: 'Pasticciotto leccese',
      description: 'Frolla calda ripena di crema pasticcera, servito tiepido',
      price: 6.00 },
    { section: 'Dolci', title: 'Tiramisù della casa',
      description: 'Savoiardi inzuppati nell\'espresso, crema al mascarpone, cacao amaro',
      price: 6.50 },
    { section: 'Dolci', title: 'Sorbetto al limone',
      description: 'Sorbetto artigianale al limone di Sorrento',
      price: 5.00 },

    // Vini
    { section: 'Vini', title: 'Primitivo di Manduria DOC',
      description: 'Calice — corposo, note di frutta rossa matura',
      price: 6.00 },
    { section: 'Vini', title: 'Negroamaro Salento IGT',
      description: 'Calice — equilibrato, sentori speziati',
      price: 5.50 },
    { section: 'Vini', title: 'Verdeca Valle d\'Itria',
      description: 'Calice — bianco fresco e minerale',
      price: 5.00 }
  ];

  const insert = db.prepare(`
    INSERT INTO menu_items (section, title, description, price, available, position)
    VALUES (@section, @title, @description, @price, 1, @position)
  `);

  const insertAll = db.transaction((rows) => {
    const positionBySection = {};
    for (const row of rows) {
      positionBySection[row.section] = (positionBySection[row.section] ?? -1) + 1;
      insert.run({ ...row, position: positionBySection[row.section] });
    }
  });

  insertAll(items);
  console.log(`[seed] Inseriti ${items.length} piatti di esempio.`);
}

seed();
