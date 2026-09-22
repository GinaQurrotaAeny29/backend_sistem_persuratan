const db = require('../../config/db');

// ============================================
// GET /master/template — Daftar template
// Query: ?jenis_surat_id=&q=&page=&limit=
// ============================================
const index = async (req, res) => {
  try {
    const { jenis_surat_id, q = '', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('template_surat')
      .leftJoin('jenis_surat', 'template_surat.jenis_surat_id', 'jenis_surat.id')
      .select(
        'template_surat.id',
        'template_surat.nama',
        'template_surat.konten_html',
        'template_surat.format_nomor',
        'template_surat.is_active',
        'template_surat.created_at',
        'template_surat.updated_at',
        'jenis_surat.id as jenis_id',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama'
      );

    if (jenis_surat_id) {
      query = query.where('template_surat.jenis_surat_id', jenis_surat_id);
    }

    if (q) {
      query = query.where('template_surat.nama', 'like', `%${q}%`);
    }

    const totalQuery = query.clone().clearSelect().count('template_surat.id as total').first();
    const dataQuery = query.orderBy('template_surat.nama', 'asc').limit(parseInt(limit)).offset(offset);

    const [totalResult, rawData] = await Promise.all([totalQuery, dataQuery]);

    const data = rawData.map((t) => ({
      id: t.id,
      nama: t.nama,
      konten_html: t.konten_html,
      format_nomor: t.format_nomor,
      is_active: !!t.is_active,
      jenis_surat: t.jenis_id
        ? { id: t.jenis_id, kode: t.jenis_kode, nama: t.jenis_nama }
        : null
    }));

    return res.status(200).json({
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.total),
        total_page: Math.ceil(parseInt(totalResult.total) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error GET /master/template:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data template'
    });
  }
};

// ============================================
// GET /master/template/:id — Detail template + fields
// ============================================
const show = async (req, res) => {
  try {
    const template = await db('template_surat')
      .leftJoin('jenis_surat', 'template_surat.jenis_surat_id', 'jenis_surat.id')
      .where('template_surat.id', req.params.id)
      .select(
        'template_surat.*',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama'
      )
      .first();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan'
      });
    }

    // Ambil fields
    const fields = await db('template_field')
      .where({ template_id: template.id })
      .orderBy('urutan', 'asc')
      .select(
        'id',
        'field_key',
        'label',
        'tipe',
        'is_required',
        'nilai_bawaan',
        'urutan',
        'opsi'
      );

    return res.status(200).json({
      success: true,
      data: {
        id: template.id,
        nama: template.nama,
        konten_html: template.konten_html,
        format_nomor: template.format_nomor,
        is_active: !!template.is_active,
        jenis_surat: template.jenis_surat_id
          ? { id: template.jenis_surat_id, kode: template.jenis_kode, nama: template.jenis_nama }
          : null,
        fields: fields.map((f) => ({
          id: f.id,
          field_key: f.field_key,
          label: f.label,
          tipe: f.tipe,
          is_required: !!f.is_required,
          nilai_bawaan: f.nilai_bawaan,
          urutan: f.urutan,
          opsi: f.opsi ? (typeof f.opsi === 'string' ? JSON.parse(f.opsi) : f.opsi) : null
        }))
      }
    });
  } catch (error) {
    console.error('Error GET /master/template/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail template'
    });
  }
};

// ============================================
// POST /master/template — Tambah template
// Body: { nama, jenis_surat_id?, konten_html, format_nomor }
// ============================================
const store = async (req, res) => {
  const { nama, jenis_surat_id, konten_html, format_nomor } = req.body;

  const errors = [];
  if (!nama) errors.push({ field: 'nama', message: 'Nama template wajib diisi' });
  if (!konten_html) errors.push({ field: 'konten_html', message: 'Konten HTML wajib diisi' });
  if (!format_nomor) errors.push({ field: 'format_nomor', message: 'Format nomor wajib diisi' });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
  }

  try {
    const [id] = await db('template_surat').insert({
      nama,
      jenis_surat_id: jenis_surat_id || null,
      konten_html,
      format_nomor,
      is_active: true
    });

    const row = await db('template_surat')
      .leftJoin('jenis_surat', 'template_surat.jenis_surat_id', 'jenis_surat.id')
      .where('template_surat.id', id)
      .select(
        'template_surat.id',
        'template_surat.nama',
        'template_surat.konten_html',
        'template_surat.format_nomor',
        'template_surat.is_active',
        'template_surat.created_at',
        'template_surat.updated_at',
        'jenis_surat.id as jenis_id',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama'
      )
      .first();

    return res.status(201).json({
      success: true,
      message: 'Template berhasil ditambahkan',
      data: {
        id: row.id,
        nama: row.nama,
        konten_html: row.konten_html,
        format_nomor: row.format_nomor,
        is_active: !!row.is_active,
        jenis_surat: row.jenis_id
          ? { id: row.jenis_id, kode: row.jenis_kode, nama: row.jenis_nama }
          : null,
        fields: []
      }
    });
  } catch (error) {
    console.error('Error POST /master/template:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan template'
    });
  }
};

// ============================================
// PUT /master/template/:id — Ubah template
// ============================================
const update = async (req, res) => {
  const id = req.params.id;
  const { nama, jenis_surat_id, konten_html, format_nomor } = req.body;

  try {
    const template = await db('template_surat').where({ id }).first();
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan'
      });
    }

    await db('template_surat').where({ id }).update({
      nama: nama || template.nama,
      jenis_surat_id: jenis_surat_id !== undefined ? jenis_surat_id : template.jenis_surat_id,
      konten_html: konten_html || template.konten_html,
      format_nomor: format_nomor || template.format_nomor,
      updated_at: new Date()
    });

    const updated = await db('template_surat')
      .leftJoin('jenis_surat', 'template_surat.jenis_surat_id', 'jenis_surat.id')
      .where('template_surat.id', id)
      .select(
        'template_surat.id',
        'template_surat.nama',
        'template_surat.konten_html',
        'template_surat.format_nomor',
        'template_surat.is_active',
        'template_surat.created_at',
        'template_surat.updated_at',
        'jenis_surat.id as jenis_id',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama'
      )
      .first();

    return res.status(200).json({
      success: true,
      message: 'Template berhasil diubah',
      data: {
        id: updated.id,
        nama: updated.nama,
        konten_html: updated.konten_html,
        format_nomor: updated.format_nomor,
        is_active: !!updated.is_active,
        jenis_surat: updated.jenis_id
          ? { id: updated.jenis_id, kode: updated.jenis_kode, nama: updated.jenis_nama }
          : null,
        fields: []
      }
    });
  } catch (error) {
    console.error('Error PUT /master/template/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah template'
    });
  }
};

// ============================================
// PATCH /master/template/:id/status
// ============================================
const ubahStatus = async (req, res) => {
  const id = req.params.id;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'is_active harus boolean (true/false)'
    });
  }

  try {
    const template = await db('template_surat').where({ id }).first();
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan'
      });
    }

    await db('template_surat').where({ id }).update({
      is_active,
      updated_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Template berhasil di${is_active ? 'aktifkan' : 'nonaktifkan'}`
    });
  } catch (error) {
    console.error('Error PATCH /master/template/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status template'
    });
  }
};

// ============================================
// GET /master/template/:id/fields — Daftar field
// ============================================
const indexFields = async (req, res) => {
  const templateId = req.params.id;

  try {
    const template = await db('template_surat').where({ id: templateId }).first();
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan'
      });
    }

    const fields = await db('template_field')
      .where({ template_id: templateId })
      .orderBy('urutan', 'asc');

    const data = fields.map((f) => ({
      id: f.id,
      field_key: f.field_key,
      label: f.label,
      tipe: f.tipe,
      is_required: !!f.is_required,
      nilai_bawaan: f.nilai_bawaan,
      urutan: f.urutan,
      opsi: f.opsi ? (typeof f.opsi === 'string' ? JSON.parse(f.opsi) : f.opsi) : null
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error GET /master/template/:id/fields:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data field'
    });
  }
};

// ============================================
// POST /master/template/:id/fields — Tambah field
// Body: { field_key, label, tipe, is_required?, nilai_bawaan?, urutan?, opsi? }
// ============================================
const storeField = async (req, res) => {
  const templateId = req.params.id;
  const { field_key, label, tipe, is_required, nilai_bawaan, urutan, opsi } = req.body;

  const errors = [];
  if (!field_key) errors.push({ field: 'field_key', message: 'field_key wajib diisi' });
  if (!label) errors.push({ field: 'label', message: 'Label wajib diisi' });
  if (!tipe || !['text', 'textarea', 'date', 'number', 'select'].includes(tipe)) {
    errors.push({ field: 'tipe', message: 'Tipe harus salah satu: text, textarea, date, number, select' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
  }

  try {
    const template = await db('template_surat').where({ id: templateId }).first();
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan'
      });
    }

    // Cek duplikasi field_key dalam template yang sama
    const existing = await db('template_field')
      .where({ template_id: templateId, field_key })
      .first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Field key "${field_key}" sudah ada di template ini`
      });
    }

    const [id] = await db('template_field').insert({
      template_id: templateId,
      field_key,
      label,
      tipe,
      is_required: !!is_required,
      nilai_bawaan: nilai_bawaan || null,
      urutan: urutan || 0,
      opsi: opsi ? JSON.stringify(opsi) : null
    });

    const newField = await db('template_field').where({ id }).first();
    const parsed = {
      id: newField.id,
      field_key: newField.field_key,
      label: newField.label,
      tipe: newField.tipe,
      is_required: !!newField.is_required,
      nilai_bawaan: newField.nilai_bawaan,
      urutan: newField.urutan,
      opsi: newField.opsi ? (typeof newField.opsi === 'string' ? JSON.parse(newField.opsi) : newField.opsi) : null
    };

    return res.status(201).json({
      success: true,
      message: 'Field berhasil ditambahkan',
      data: parsed
    });
  } catch (error) {
    console.error('Error POST /master/template/:id/fields:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan field'
    });
  }
};

// ============================================
// PUT /master/template/:id/fields/:fieldId — Ubah field
// ============================================
const updateField = async (req, res) => {
  const { id: templateId, fieldId } = req.params;
  const { field_key, label, tipe, is_required, nilai_bawaan, urutan, opsi } = req.body;

  try {
    const field = await db('template_field')
      .where({ id: fieldId, template_id: templateId })
      .first();
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field tidak ditemukan'
      });
    }

    await db('template_field').where({ id: fieldId }).update({
      field_key: field_key || field.field_key,
      label: label || field.label,
      tipe: tipe || field.tipe,
      is_required: is_required !== undefined ? !!is_required : field.is_required,
      nilai_bawaan: nilai_bawaan !== undefined ? nilai_bawaan : field.nilai_bawaan,
      urutan: urutan !== undefined ? urutan : field.urutan,
      opsi: opsi !== undefined ? (opsi ? JSON.stringify(opsi) : null) : field.opsi,
      updated_at: new Date()
    });

    const updated = await db('template_field').where({ id: fieldId }).first();
    const parsed = {
      id: updated.id,
      field_key: updated.field_key,
      label: updated.label,
      tipe: updated.tipe,
      is_required: !!updated.is_required,
      nilai_bawaan: updated.nilai_bawaan,
      urutan: updated.urutan,
      opsi: updated.opsi ? (typeof updated.opsi === 'string' ? JSON.parse(updated.opsi) : updated.opsi) : null
    };

    return res.status(200).json({
      success: true,
      message: 'Field berhasil diubah',
      data: parsed
    });
  } catch (error) {
    console.error('Error PUT /master/template/:id/fields/:fieldId:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah field'
    });
  }
};

// ============================================
// DELETE /master/template/:id/fields/:fieldId
// ============================================
const deleteField = async (req, res) => {
  const { id: templateId, fieldId } = req.params;

  try {
    const field = await db('template_field')
      .where({ id: fieldId, template_id: templateId })
      .first();
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field tidak ditemukan'
      });
    }

    await db('template_field').where({ id: fieldId }).del();

    return res.status(200).json({
      success: true,
      message: 'Field berhasil dihapus'
    });
  } catch (error) {
    console.error('Error DELETE /master/template/:id/fields/:fieldId:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus field'
    });
  }
};

module.exports = {
  index,
  show,
  store,
  update,
  ubahStatus,
  indexFields,
  storeField,
  updateField,
  deleteField
};