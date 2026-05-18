import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Avatar,
  Button,
  Center,
  Loader,
  SegmentedControl,
  Select,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { modals } from '@mantine/modals'
import { isAxiosError } from 'axios'
import { Calendar, Download, List, MapPin, Phone, Table as TableIcon, Video } from 'lucide-react'
import { useBookingStore } from '@/store'
import { showNotification } from '@/utils/notifications'
import type { Appointment, AppointmentDatePreset, LocationType } from '@/types/bookings'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

type AppointmentView = 'list' | 'table'
type DateFilterOption = AppointmentDatePreset | 'custom'

const DATE_FILTER_OPTIONS: { value: DateFilterOption; label: string }[] = [
  { value: 'all-upcoming', label: 'All upcoming' },
  { value: 'all-past', label: 'All past' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'next7', label: 'Next 7 days' },
  { value: 'next30', label: 'Next 30 days' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom date' },
]

const LOCATION_LABELS: Record<LocationType, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  IN_PERSON: 'In person',
  PHONE: 'Phone call',
}

const formatTimeRange = (date: string, timeslot: string, duration: number | null): string => {
  const start = dayjs(`${date}T${timeslot}`)
  const end = start.add(duration ?? 30, 'minute')
  return `${start.format('h:mm A')} - ${end.format('h:mm A')}`
}

const deriveName = (email: string): string => {
  const local = email.split('@')[0] ?? email
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || email
  )
}

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')

export const Appointments: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const {
    appointments,
    fetchingAppointments,
    appointmentsError,
    fetchAppointments,
    exportAppointmentsAsPDF,
    exportingAppointmentsPdf,
  } = useBookingStore()
  const [filterOption, setFilterOption] = useState<DateFilterOption>('next7')
  const [customDate, setCustomDate] = useState<Date | null>(null)
  const [view, setView] = useState<AppointmentView>('list')

  const dateFilterParam = useMemo<string | null>(() => {
    if (filterOption === 'custom') {
      return customDate ? dayjs(customDate).format('YYYY-MM-DD') : null
    }
    return filterOption
  }, [filterOption, customDate])

  const filterDescription = useMemo<string | null>(() => {
    switch (filterOption) {
      case 'all-upcoming':
        return 'all upcoming'
      case 'all-past':
        return 'all past'
      case 'today':
        return 'today'
      case 'tomorrow':
        return 'tomorrow'
      case 'yesterday':
        return 'yesterday'
      case 'next7':
        return 'in next 7 days'
      case 'next30':
        return 'in next 30 days'
      case 'last7':
        return 'in last 7 days'
      case 'last30':
        return 'in last 30 days'
      case 'custom':
        return customDate ? `on ${dayjs(customDate).format('MMM D, YYYY')}` : null
    }
  }, [filterOption, customDate])

  const emptyStateText = useMemo<string>(() => {
    switch (filterOption) {
      case 'all-upcoming':
        return 'No upcoming appointments'
      case 'all-past':
        return 'No past appointments'
      default:
        return filterDescription ? `No appointments ${filterDescription}` : 'No appointments'
    }
  }, [filterOption, filterDescription])

  useEffect(() => {
    if (!chatbotId) return
    if (filterOption === 'custom' && !customDate) return
    fetchAppointments(chatbotId, dateFilterParam).catch(err => {
      if (isAxiosError(err) && err.response && err.response.status < 500) {
        showNotification('error', 'Could not load appointments. Please try again.')
      }
    })
  }, [chatbotId, filterOption, dateFilterParam, customDate, fetchAppointments])

  const handleExportPDF = useCallback(async () => {
    if (!chatbotId) return
    try {
      const blob = await exportAppointmentsAsPDF(chatbotId, dateFilterParam)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appointments-${dateFilterParam ?? 'all'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showNotification('success', 'Appointments exported.')
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status
        if (status === 404) {
          showNotification('error', 'This chatbot no longer exists.')
        } else if (status < 500) {
          showNotification('error', 'Could not export appointments. Please try again.')
        }
      }
    }
  }, [chatbotId, dateFilterParam, exportAppointmentsAsPDF])

  const canExport =
    appointments.length > 0 && !(filterOption === 'custom' && !customDate)

  return (
    <div className="lg:m-5 m-2 min-h-[calc(100%-40px)] border border-border-week bg-white rounded-xl">
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-border-week px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-gray-900">Appointments</h2>
          <p className="text-xs text-gray-500">
            Meetings booked by users with your chatbot
            {filterDescription ? ` (${filterDescription})` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <SegmentedControl
            size="xs"
            value={view}
            onChange={v => setView(v as AppointmentView)}
            data={[
              {
                value: 'list',
                label: (
                  <Tooltip label="List view" position="top" withArrow>
                    <Center style={{ gap: 10 }}>
                      <List size={16} />
                    </Center>
                  </Tooltip>
                ),
              },
              {
                value: 'table',
                label: (
                  <Tooltip label="Table view" position="top" withArrow>
                    <Center style={{ gap: 10 }}>
                      <TableIcon size={16} />
                    </Center>
                  </Tooltip>
                ),
              },
            ]}
          />
          {filterOption === 'custom' && (
            <DateInput
              size="xs"
              value={customDate}
              onChange={value => setCustomDate(value ? new Date(value) : null)}
              placeholder="Pick a date"
              valueFormat="MMM D, YYYY"
              clearable
              w={170}
            />
          )}
          <Select
            size="xs"
            value={filterOption}
            onChange={v => {
              if (!v) return
              setFilterOption(v as DateFilterOption)
              if (v !== 'custom') setCustomDate(null)
            }}
            data={DATE_FILTER_OPTIONS}
            allowDeselect={false}
            w={160}
          />
          <Tooltip label="Export as PDF">
            <Button
              variant="default"
              size="compact-sm"
              radius="md"
              onClick={handleExportPDF}
              loading={exportingAppointmentsPdf}
              disabled={!canExport}
            >
              <Download size={16} strokeWidth={1.5} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="p-4">
        {fetchingAppointments ? (
          <div className="flex items-center justify-center py-16">
            <Loader size="sm" />
          </div>
        ) : appointmentsError ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-red-500">
            {appointmentsError}
          </div>
        ) : filterOption === 'custom' && !customDate ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400">
            <Calendar size={32} className="mb-2 opacity-50" />
            Pick a date to view appointments
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400">
            <Calendar size={32} className="mb-2 opacity-50" />
            {emptyStateText}
          </div>
        ) : view === 'list' ? (
          <ul className="flex flex-col gap-3">
            {appointments.map(appt => (
              <AppointmentRow key={appt.id} appointment={appt} />
            ))}
          </ul>
        ) : (
          <AppointmentsTable items={appointments} />
        )}
      </div>
    </div>
  )
}

const AppointmentsTable: React.FC<{ items: Appointment[] }> = ({ items }) => {
  const hasAnyCancellable = items.some(a => a.status === 'UPCOMING')
  return (
    <Table.ScrollContainer minWidth={900} type="native">
      <Table
        verticalSpacing="md"
        horizontalSpacing="md"
        withTableBorder
        withColumnBorders
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Time</Table.Th>
            <Table.Th>Meeting Type</Table.Th>
            <Table.Th>Location</Table.Th>
            {hasAnyCancellable && <Table.Th>Action</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map(appt => (
            <AppointmentTableRow
              key={appt.id}
              appointment={appt}
              showActionCol={hasAnyCancellable}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

const AppointmentTableRow: React.FC<{ appointment: Appointment; showActionCol: boolean }> = ({
  appointment,
  showActionCol,
}) => {
  const showCancel = appointment.status === 'UPCOMING'
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { cancelAppointment, cancellingAppointmentId } = useBookingStore()
  const name = appointment.name ?? deriveName(appointment.email)
  const isCancelling = cancellingAppointmentId === appointment.id
  const { locationType, locationAddress, locationPhone, meetLink } = appointment
  const meetingType = locationType ? LOCATION_LABELS[locationType] : '—'

  const locationDisplay =
    locationType === 'GOOGLE_MEET' && meetLink ? (
      <a
        href={meetLink}
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline"
      >
        {meetLink}
      </a>
    ) : locationType === 'PHONE' && locationPhone ? (
      locationPhone
    ) : locationType === 'IN_PERSON' && locationAddress ? (
      locationAddress
    ) : (
      '—'
    )

  const handleCancel = () => {
    if (!chatbotId) return
    modals.openConfirmModal({
      title: 'Cancel appointment',
      centered: true,
      children: (
        <Text size="sm">
          {`Cancel the appointment with ${name} on ${dayjs(appointment.date).format('MMM D, YYYY')} at ${dayjs(
            `${appointment.date}T${appointment.timeslot}`
          ).format('h:mm A')}? This will remove it from Google Calendar and notify the invitee.`}
        </Text>
      ),
      labels: { confirm: 'Cancel appointment', cancel: 'Keep' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        try {
          await cancelAppointment(chatbotId, appointment.id)
          showNotification('success', 'Appointment cancelled.')
        } catch (e) {
          if (isAxiosError(e) && e.response) {
            const status = e.response.status
            if (status === 404) {
              showNotification('error', 'This appointment no longer exists.')
            } else if (status === 400) {
              showNotification('error', 'This appointment is already cancelled.')
            } else if (status < 500) {
              showNotification('error', 'Could not cancel appointment. Please try again.')
            }
          }
        }
      },
    })
  }

  return (
    <Table.Tr>
      <Table.Td className="text-sm font-medium whitespace-nowrap">{name}</Table.Td>
      <Table.Td className="text-sm text-gray-600 whitespace-nowrap">{appointment.email}</Table.Td>
      <Table.Td className="text-sm whitespace-nowrap">
        {dayjs(appointment.date).format('MMM D, YYYY')}
      </Table.Td>
      <Table.Td className="text-sm whitespace-nowrap">
        {formatTimeRange(appointment.date, appointment.timeslot, appointment.duration)}
      </Table.Td>
      <Table.Td className="text-sm whitespace-nowrap">{meetingType}</Table.Td>
      <Table.Td className="text-sm text-gray-600 max-w-[280px] truncate">
        {locationDisplay}
      </Table.Td>
      {showActionCol && (
        <Table.Td>
          {showCancel ? (
            <Button
              variant="outline"
              color="red"
              size="xs"
              onClick={handleCancel}
              loading={isCancelling}
            >
              Cancel
            </Button>
          ) : null}
        </Table.Td>
      )}
    </Table.Tr>
  )
}

const AppointmentRow: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const showCancel = appointment.status === 'UPCOMING'
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { cancelAppointment, cancellingAppointmentId } = useBookingStore()
  const name = appointment.name ?? deriveName(appointment.email)
  const { locationType, locationAddress, locationPhone, meetLink } = appointment
  const locationLabel = locationType ? LOCATION_LABELS[locationType] : 'No location set'
  const LocationIcon =
    locationType === 'IN_PERSON' ? MapPin : locationType === 'PHONE' ? Phone : Video
  const isCancelling = cancellingAppointmentId === appointment.id

  const handleCancel = () => {
    if (!chatbotId) return
    modals.openConfirmModal({
      title: 'Cancel appointment',
      centered: true,
      children: (
        <Text size="sm">
          {`Cancel the appointment with ${name} on ${dayjs(appointment.date).format('MMM D, YYYY')} at ${dayjs(
            `${appointment.date}T${appointment.timeslot}`
          ).format('h:mm A')}? This will remove it from Google Calendar and notify the invitee.`}
        </Text>
      ),
      labels: { confirm: 'Cancel appointment', cancel: 'Keep' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        try {
          await cancelAppointment(chatbotId, appointment.id)
          showNotification('success', 'Appointment cancelled.')
        } catch (e) {
          if (isAxiosError(e) && e.response) {
            const status = e.response.status
            if (status === 404) {
              showNotification('error', 'This appointment no longer exists.')
            } else if (status === 400) {
              showNotification('error', 'This appointment is already cancelled.')
            } else if (status < 500) {
              showNotification('error', 'Could not cancel appointment. Please try again.')
            }
          }
        }
      },
    })
  }

  return (
    <li className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 border border-border-week rounded-lg p-4 hover:bg-background-dark-week transition-colors">
      <div className="flex items-center gap-3 min-w-0 md:basis-1/4 md:shrink-0">
        <Avatar size="md" color="brand" radius="xl">
          {getInitials(name)}
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{name}</span>
          <span className="text-xs text-gray-500 truncate">{appointment.email}</span>
        </div>
        {showCancel && (
          <div className="shrink-0 md:hidden">
            <Button
              variant="outline"
              color="red"
              size="xs"
              onClick={handleCancel}
              loading={isCancelling}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-row items-center gap-4 min-w-0 md:contents">
        <div className="flex flex-col min-w-0 md:basis-[15%] md:shrink-0">
          <span className="text-xs text-gray-700 truncate">
            {dayjs(appointment.date).format('MMM D, YYYY')}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {dayjs(`${appointment.date}T${appointment.timeslot}`).format('h:mm A')}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0 flex-1">
          <LocationIcon size={20} className="text-gray-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="truncate">{locationLabel}</span>
            {locationType === 'GOOGLE_MEET' && meetLink ? (
              <a
                href={meetLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline truncate"
              >
                {meetLink}
              </a>
            ) : locationType === 'PHONE' && locationPhone ? (
              <span className="text-xs text-gray-400 truncate">{locationPhone}</span>
            ) : locationType === 'IN_PERSON' && locationAddress ? (
              <span className="text-xs text-gray-400 truncate">{locationAddress}</span>
            ) : null}
          </div>
        </div>
      </div>

      {showCancel && (
        <div className="shrink-0 hidden md:block">
          <Button
            variant="outline"
            color="red"
            size="xs"
            onClick={handleCancel}
            loading={isCancelling}
          >
            Cancel
          </Button>
        </div>
      )}
    </li>
  )
}
