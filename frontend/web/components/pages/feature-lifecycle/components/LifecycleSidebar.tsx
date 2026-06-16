import React, { FC } from 'react'
import classNames from 'classnames'
import SidebarLink from 'components/navigation/SidebarLink'
import EnvironmentSelect from 'components/EnvironmentTagSelect'
import { SECTIONS } from 'components/pages/feature-lifecycle/constants'
import type {
  Section,
  LifecycleCounts,
} from 'components/pages/feature-lifecycle/types'

type LifecycleSidebarProps = {
  projectId: number
  activeSection: Section
  counts: LifecycleCounts
  isLoading: boolean
  environmentId: number
  onEnvironmentChange: (environmentId: number) => void
}

const LifecycleSidebar: FC<LifecycleSidebarProps> = ({
  activeSection,
  counts,
  environmentId,
  isLoading,
  onEnvironmentChange,
  projectId,
}) => {
  return (
    <div className='border-md-right home-aside d-flex flex-column pe-0 me-0'>
      <div className='flex-1 flex-column ms-0 me-2'>
        <div className='px-2 pt-2'>
          <div className='text-muted fs-captionXSmall mb-1'>ENVIRONMENT</div>
          <EnvironmentSelect
            projectId={projectId}
            value={`${environmentId}`}
            onChange={(v) => onEnvironmentChange(Number(v))}
            idField='id'
          />
        </div>
        <hr className='mt-1 mb-2' />
        <div className='d-flex flex-column mx-0 py-1 py-md-0 gap-1'>
          {SECTIONS.map((s) => (
            <SidebarLink
              key={s.key}
              icon={s.icon}
              className='lh-1'
              to={`/project/${projectId}/lifecycle/${s.key}`}
              isActive={() => activeSection === s.key}
            >
              <div className='d-flex align-items-center'>
                {s.label}
                <span
                  className={classNames('ms-1 px-2 unread rounded d-inline', {
                    'bg-light300 text-muted': activeSection !== s.key,
                  })}
                >
                  {isLoading ? '...' : counts[s.key] ?? 0}
                </span>
              </div>
            </SidebarLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LifecycleSidebar
