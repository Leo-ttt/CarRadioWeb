import { ResourceCategory, ResourceLink, IResourceCategory, IResourceLink } from '../models/ResourceLink'

// ==================== Category CRUD ====================

export const getCategories = async (): Promise<IResourceCategory[]> => {
  return ResourceCategory.find().sort({ order: 1, createdAt: 1 })
}

export const createCategory = async (data: Partial<IResourceCategory>): Promise<IResourceCategory> => {
  const category = new ResourceCategory(data)
  return category.save()
}

export const updateCategory = async (id: string, data: Partial<IResourceCategory>): Promise<IResourceCategory | null> => {
  return ResourceCategory.findByIdAndUpdate(id, data, { new: true })
}

export const deleteCategory = async (id: string): Promise<void> => {
  // Delete all links in this category first
  await ResourceLink.deleteMany({ categoryId: id })
  await ResourceCategory.findByIdAndDelete(id)
}

// ==================== Link CRUD ====================

export const getLinks = async (categoryId?: string): Promise<IResourceLink[]> => {
  const filter = categoryId ? { categoryId } : {}
  return ResourceLink.find(filter).sort({ order: 1, createdAt: 1 }).populate('categoryId', 'name slug')
}

export const getEnabledLinksGrouped = async (): Promise<{ category: IResourceCategory; links: IResourceLink[] }[]> => {
  const categories = await ResourceCategory.find({ enabled: true }).sort({ order: 1 })
  const result: { category: IResourceCategory; links: IResourceLink[] }[] = []

  for (const category of categories) {
    const links = await ResourceLink.find({ categoryId: category._id, enabled: true }).sort({ order: 1 })
    if (links.length > 0) {
      result.push({ category, links })
    }
  }

  return result
}

export const createLink = async (data: Partial<IResourceLink>): Promise<IResourceLink> => {
  const link = new ResourceLink(data)
  return link.save()
}

export const updateLink = async (id: string, data: Partial<IResourceLink>): Promise<IResourceLink | null> => {
  return ResourceLink.findByIdAndUpdate(id, data, { new: true })
}

export const deleteLink = async (id: string): Promise<void> => {
  await ResourceLink.findByIdAndDelete(id)
}
