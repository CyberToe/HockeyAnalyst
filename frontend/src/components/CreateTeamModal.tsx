import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { teamsApi } from '../lib/api'
import toast from 'react-hot-toast'
import SimpleModal from './SimpleModal'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateTeamForm {
  name: string
  description?: string
  imageFile?: File
  type: 'BASIC_FREE' | 'STANDARD_MONTHLY'
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamForm>({
    defaultValues: {
      type: 'BASIC_FREE'
    }
  })

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: CreateTeamForm) => {
    try {
      setIsLoading(true)
      
      // Convert image file to base64 for now (in production, upload to cloud storage)
      let imageUrl = undefined
      if (data.imageFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          imageUrl = e.target?.result as string
        }
        reader.readAsDataURL(data.imageFile)
        // Wait for the reader to complete
        await new Promise(resolve => reader.onloadend = resolve)
      }
      
      const teamData = {
        name: data.name,
        description: data.description,
        imageUrl,
        type: data.type,
        state: 'ACTIVE' // Always set to active for new teams
      }
      
      await teamsApi.createTeam(teamData)
      toast.success('Team created successfully!')
      reset()
      setImagePreview(null)
      onSuccess()
    } catch (error) {
      // Error is handled by API interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <SimpleModal isOpen={isOpen} onClose={handleClose} title="Create New Team">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Team Name *
                  </label>
                  <input
                    {...register('name', {
                      required: 'Team name is required',
                      minLength: {
                        value: 1,
                        message: 'Team name is required',
                      },
                      maxLength: {
                        value: 100,
                        message: 'Team name is too long',
                      },
                    })}
                    type="text"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="Enter team name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description', {
                      maxLength: {
                        value: 500,
                        message: 'Description is too long',
                      },
                    })}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder="Enter team description (optional)"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">
                    Team Image
                  </label>
                  <input
                    {...register('imageFile')}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Team image preview" 
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Team Type
                  </label>
                  <select
                    {...register('type')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="BASIC_FREE">Basic - Free</option>
                    <option value="STANDARD_MONTHLY">Standard - Monthly Subscription</option>
                  </select>
                </div>

              </div>

              <div className="mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Create Team'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
      </form>
    </SimpleModal>
  )
}
