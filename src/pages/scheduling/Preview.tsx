import React, {useEffect, useState} from "react"

export default ({url}: { url: string }) => {
    const [showPreview, setShowPreview] = useState(false)
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)

    useEffect(() => {
        const timeoutId =
            setTimeout(() => {
                setShowPreview(url.trim().length !== 0)
                setIsPreviewLoading(true)
            }, 500)
        setShowPreview(false)

        return () => clearTimeout(timeoutId)
    }, [url])

    return (
        <div className="preview">
            {showPreview && isPreviewLoading && <div>Loading</div>}
            {showPreview && <iframe style={isPreviewLoading ? ({display: "none"}) : ({})} src={url}
                                    onLoad={() => setIsPreviewLoading(false)}/>}
        </div>
    )
}
