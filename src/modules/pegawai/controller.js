const db = require('../../config/db');

// GET /pegawai/penerima-disposisi?q=
const getPenerimaDisposisi = async (req, res) => {
  try {
    const { q = '' } = req.query;

    const query = db('pegawai')
      .join('users', 'pegawai.user_id', 'users.id')
      .where('users.status', 'aktif')
      .where('pegawai.status', 'aktif')
      .select(
        'pegawai.id',
        'pegawai.nama',
        'pegawai.nip',
        'pegawai.jabatan',
        'users.id as user_id',
        'users.username'
      )
      .orderBy('pegawai.nama');

    // Jika ada keyword pencarian
    if (q) {
      query.where(function() {
        this.where('pegawai.nama', 'like', `%${q}%`)
          .orWhere('pegawai.nip', 'like', `%${q}%`)
          .orWhere('users.username', 'like', `%${q}%`);
      });
    }

    const data = await query;

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error GET /pegawai/penerima-disposisi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pegawai'
    });
  }
};

module.exports = { getPenerimaDisposisi };