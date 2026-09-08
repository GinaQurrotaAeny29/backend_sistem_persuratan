const db = require('../../config/db');
const generateNomorAgenda = require('../../utils/generateAgenda');

// GET /surat-masuk (sudah ada)
const index = async (req, res) => {
  try {
    const data = await db('surat_masuk')
      .select('*')
      .orderBy('created_at', 'desc');

    return res.status(200).json({
      success: true,
      data: data,
      meta: {
        page: 1,
        limit: 10,
        total: data.length,
        total_page: Math.ceil(data.length / 10)
      }
    });
  } catch (error) {
    console.error('Error GET /surat-masuk:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data surat masuk'
    });
  }
};

// POST /surat-masuk (TAMBAHKAN INI)
const store = async (req, res) => {
  try {
    const { nomor_surat, tanggal_surat, pengirim, perihal, pic, keterangan } = req.body;

    // Validasi wajib
    if (!nomor_surat || !tanggal_surat || !pengirim || !perihal) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: [
          { field: 'nomor_surat', message: 'Nomor surat wajib diisi' },
          { field: 'tanggal_surat', message: 'Tanggal surat wajib diisi' },
          { field: 'pengirim', message: 'Pengirim wajib diisi' },
          { field: 'perihal', message: 'Perihal wajib diisi' }
        ]
      });
    }

    // Generate nomor agenda otomatis
    const tahun = new Date(tanggal_surat).getFullYear();
    const nomor_agenda = await generateNomorAgenda(tahun);

    // Data file (jika ada)
    let file_name = null;
    let file_path = null;
    let file_size = null;

    if (req.file) {
      file_name = req.file.originalname;
      file_path = req.file.path;
      file_size = req.file.size;
    }

    // Insert ke database
    const [id] = await db('surat_masuk').insert({
      nomor_agenda,
      nomor_surat,
      tanggal_surat,
      pengirim,
      perihal,
      pic: pic || null,
      keterangan: keterangan || null,
      file_name,
      file_path,
      file_size,
      dibuat_oleh: req.user.id // dari token
    });

    // Ambil data yang baru disimpan
    const newData = await db('surat_masuk').where({ id }).first();

    return res.status(201).json({
      success: true,
      message: 'Surat masuk berhasil ditambahkan',
      data: newData
    });

  } catch (error) {
    console.error('Error POST /surat-masuk:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan surat masuk: ' + error.message
    });
  }
};

module.exports = { index, store };