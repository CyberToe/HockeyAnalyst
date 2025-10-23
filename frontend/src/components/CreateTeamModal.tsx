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
}

type SubscriptionType = 'BASIC_FREE' | 'STANDARD_MONTHLY' | 'STANDARD_YEARLY'

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'form' | 'subscription'>('form')
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionType | null>(null)
  const [formData, setFormData] = useState<CreateTeamForm | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamForm>()

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

  const onFormSubmit = (data: CreateTeamForm) => {
    // Store form data and move to subscription selection step
    setFormData(data)
    setCurrentStep('subscription')
  }

  const onSubscriptionSelect = async (subscriptionType: SubscriptionType) => {
    if (!formData) {
      console.error('No form data available')
      return
    }

    try {
      setIsLoading(true)
      setSelectedSubscription(subscriptionType)
      
      // Convert image file to base64 for now (in production, upload to cloud storage)
      let imageUrl = undefined
      if (formData.imageFile && formData.imageFile.size > 0) {
        const reader = new FileReader()
        reader.onload = (e) => {
          imageUrl = e.target?.result as string
        }
        reader.readAsDataURL(formData.imageFile)
        // Wait for the reader to complete
        await new Promise(resolve => reader.onloadend = resolve)
      }
      
      const teamData = {
        name: formData.name,
        description: formData.description,
        imageUrl,
        type: subscriptionType,
        state: 'ACTIVE' // Always set to active for new teams
      }
      
      await teamsApi.createTeam(teamData)
      toast.success('Team created successfully!')
      reset()
      setImagePreview(null)
      setCurrentStep('form')
      setSelectedSubscription(null)
      setFormData(null)
      onSuccess()
    } catch (error) {
      console.error('Error creating team:', error)
      // Error is handled by API interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setCurrentStep('form')
    setSelectedSubscription(null)
    setImagePreview(null)
    setFormData(null)
    onClose()
  }

  const handleBack = () => {
    setCurrentStep('form')
  }

  return (
    <SimpleModal isOpen={isOpen} onClose={handleClose} title="Create New Team">
      {currentStep === 'form' ? (
        <form onSubmit={handleSubmit(onFormSubmit)} className="mt-6">
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
          </div>

          <div className="mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Next
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
      ) : (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Team Option */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Team</h3>
              <p className="text-sm text-gray-600 mb-4">Team Management and Analytics</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏒</span>
                  <span className="text-sm text-gray-700">Unlimited Games</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <span className="text-sm text-gray-700">Unlimited Members</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <span className="text-sm text-gray-700">Unlimited Exported Statistic Reports</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => onSubscriptionSelect('STANDARD_MONTHLY')}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && selectedSubscription === 'STANDARD_MONTHLY' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Monthly Subscription - $9.99 / mo (USD)'
                  )}
                </button>
                <button
                  onClick={() => onSubscriptionSelect('STANDARD_YEARLY')}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && selectedSubscription === 'STANDARD_YEARLY' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Yearly Subscription - $6.99 / mo (USD) (billed annually)'
                  )}
                </button>
              </div>
            </div>

            {/* Free Team Option */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Free Team</h3>
              <p className="text-sm text-gray-600 mb-4">Team Management and Analytics</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏒</span>
                  <span className="text-sm text-gray-700">1 Game</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <span className="text-sm text-gray-700">3 Members including the owner</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <span className="text-sm text-gray-700">5 Exported Statistic Reports</span>
                </div>
              </div>

              <button
                onClick={() => onSubscriptionSelect('BASIC_FREE')}
                disabled={isLoading}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && selectedSubscription === 'BASIC_FREE' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Free - Can be upgraded later'
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleBack}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </SimpleModal>
  )
}
