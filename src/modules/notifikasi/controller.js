const db = require('../../config/db');

// ============================================
// GET /notifikasi
// Query: ?belum_dibaca=&limit=
// ============================================
const index = async (req, res) => {
  const pegawaiId = req.user.pegawai_id;
  const { belum_dibaca, limit } = req.query;

  try {
    let query = db('notifikasi')
      .where({ pegawai_id: pegawaiId })
      .orderBy('waktu', 'desc');

    // Filter hanya yang belum dibaca
    if (belum_dibaca === 'true' || belum_dibaca === '1') {
      query = query.where('dibaca', false);
    }

    // Batasi jumlah
    if (limit) {
      const lim = parseInt(limit, 10);
      if (!isNaN(lim) && lim > 0) {
        query = query.limit(lim);
      }
    }

    const data = await query;

    // Hitung total belum dibaca (selalu untuk seluruh data, bukan hasil filter)
    const totalBelumDibaca = await db('notifikasi')
      .where({ pegawai_id: pegawaiId, dibaca: false })
      .count('id as total')
      .first();

    // Format response sesuai kontrak §3.10
    const formatted = data.map((n) => ({
      id: n.id,
      jenis: n.jenis,
      judul: n.judul,
      keterangan: n.keterangan,
      waktu: n.waktu,
      dibaca: !!n.dibaca,
      tautan: n.tautan_tipe && n.tautan_id ? {
        tipe: n.tautan_tipe,
        id: n.tautan_id
      } : null
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      meta: {
        belum_dibaca: parseInt(totalBelumDibaca.total, 10)
      }
    });

  } catch (error) {
    console.error('Error GET /notifikasi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data notifikasi'
    });
  }
};

// ============================================
// PATCH /notifikasi/baca-semua
// ============================================
const bacaSemua = async (req, res) => {
  const pegawaiId = req.user.pegawai_id;

  try {
    const updated = await db('notifikasi')
      .where({ pegawai_id: pegawaiId, dibaca: false })
      .update({
        dibaca: true,
        dibaca_pada: new Date()
      });

    return res.status(200).json({
      success: true,
      message: `Semua notifikasi ditandai sudah dibaca (${updated} notifikasi)`
    });

  } catch (error) {
    console.error('Error PATCH /notifikasi/baca-semua:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menandai notifikasi'
    });
  }
};

module.exports = { index, bacaSemua };