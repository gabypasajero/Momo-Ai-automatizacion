export const formatClp = (value: number) => '$' + value.toLocaleString('es-CL')

export const formatNumber = (value: number) => value.toLocaleString('es-CL')

export const nowTime = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
