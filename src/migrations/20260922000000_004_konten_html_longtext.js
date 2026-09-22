// Kolom konten_html tadinya TEXT (batas ~64KB di MySQL). Karena isinya
// berisi gambar logo dalam bentuk base64 + markup kop surat, isian yang
// pernah disimpan berulang kali (mis. dari editor template) bisa melebihi
// batas itu dan KEPOTONG DI TENGAH — inilah yang membuat logo tampil rusak
// (base64-nya cacat, jadi browser cuma menampilkan teks alt-nya saja).
// LONGTEXT menaikkan batas jadi ~4GB, jauh lebih dari cukup dan mencegah
// masalah ini terulang.
exports.up = function (knex) {
  return knex.schema.alterTable('template_surat', (table) => {
    table.text('konten_html', 'longtext').notNullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('template_surat', (table) => {
    table.text('konten_html').notNullable().alter();
  });
};