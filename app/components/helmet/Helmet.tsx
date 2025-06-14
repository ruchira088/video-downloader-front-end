import {type FC, useEffect} from "react"

type HelmetProps = {
  readonly title: string
}

const Helmet: FC<HelmetProps> = props => {
  useEffect(() => {
    document.title = props.title
  }, [props.title])

  return <></>
}

export default Helmet