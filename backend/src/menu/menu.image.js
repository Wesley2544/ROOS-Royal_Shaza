import multer from 'multer'
import { supabase } from '../lib/supabaseClient.js'
import prisma from '../lib/prisma.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  },
})
export const uploadMiddleware = upload.single('image')

export async function uploadItemImage(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No image file provided')
      err.status = 400
      throw err
    }
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } })
    if (!item) {
      const err = new Error('Menu item not found')
      err.status = 404
      throw err
    }

    const ext = req.file.originalname.split('.').pop() || 'jpg'
    const filePath = `items/${item.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('menu-images').getPublicUrl(filePath)

    const updated = await prisma.menuItem.update({
      where: { id: item.id },
      data: { image_url: publicUrlData.publicUrl },
    })

    res.json(updated)
  } catch (err) { next(err) }
}