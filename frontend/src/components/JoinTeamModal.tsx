import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { teamsApi } from '../lib/api'
import toast from 'react-hot-toast'
import SimpleModal from './SimpleModal'

interface JoinTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface JoinTeamForm {
  teamCode: string
}

export default function JoinTeamModal({ isOpen, onClose, onSuccess }: JoinTeamModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinTeamForm>()

  const onSubmit = async (data: JoinTeamForm) => {
    try {
      setIsLoading(true)
      await teamsApi.joinTeam(data)
      toast.success('Successfully joined team!')
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
    <SimpleModal isOpen={isOpen} onClose={handleClose} title="Join a Team">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
              <div>
                <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700">
                  Team Code *
                </label>
                <input
                  {...register('teamCode', {
                    required: 'Team code is required',
                    pattern: {
                      value: /^[A-Z0-9]{7}$/,
                      message: 'Team code must be exactly 7 characters (letters and numbers)',
                    },
                  })}
                  type="text"
                  placeholder="ABC1234"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.teamCode ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm uppercase`}
                  style={{ textTransform: 'uppercase' }}
                  maxLength={7}
                />
                {errors.teamCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.teamCode.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Ask your team administrator for the 7-character team code.
                </p>
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
                    'Join Team'
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
