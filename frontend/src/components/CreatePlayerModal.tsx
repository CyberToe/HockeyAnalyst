import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { playersApi } from '../lib/api'
import toast from 'react-hot-toast'
import SimpleModal from './SimpleModal'

interface CreatePlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teamId: string
}

interface CreatePlayerForm {
  name: string
  number?: number
}

export default function CreatePlayerModal({ isOpen, onClose, onSuccess, teamId }: CreatePlayerModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlayerForm>()

  const onSubmit = async (data: CreatePlayerForm) => {
    try {
      setIsLoading(true)
      // Clean up the data - remove number if it's empty or NaN
      const cleanData = {
        name: data.name,
        ...(data.number && data.number !== '' && !isNaN(Number(data.number)) ? { number: Number(data.number) } : {})
      }
      await playersApi.createPlayer(teamId, cleanData)
      toast.success('Player added successfully!')
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
    <SimpleModal isOpen={isOpen} onClose={handleClose} title="Add New Player">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Player Name *
            </label>
            <input
              {...register('name', { required: 'Player name is required' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter player name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">
              Jersey Number
            </label>
            <input
              {...register('number')}
              type="number"
              min="1"
              max="99"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter jersey number (optional)"
            />
            {errors.number && (
              <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>
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
            {isLoading ? 'Adding...' : 'Add Player'}
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
