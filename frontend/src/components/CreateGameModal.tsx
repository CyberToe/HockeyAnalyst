import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { gamesApi } from '../lib/api'
import toast from 'react-hot-toast'
import SimpleModal from './SimpleModal'

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teamId: string
}

interface CreateGameForm {
  opponent?: string
  location?: string
  startTime?: string
  notes?: string
}

export default function CreateGameModal({ isOpen, onClose, onSuccess, teamId }: CreateGameModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGameForm>()

  const onSubmit = async (data: CreateGameForm) => {
    try {
      setIsLoading(true)
      await gamesApi.createGame(teamId, data)
      toast.success('Game created successfully!')
      reset()
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
    <SimpleModal isOpen={isOpen} onClose={handleClose} title="Create New Game">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-700">
              Opponent Team
            </label>
            <input
              {...register('opponent')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter opponent team name (optional)"
            />
            {errors.opponent && (
              <p className="mt-1 text-sm text-red-600">{errors.opponent.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              {...register('location')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter game location (optional)"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              {...register('startTime')}
              type="datetime-local"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter any additional notes (optional)"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
