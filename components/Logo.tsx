import { useInitEffect } from "@/components/utils"
import { useState } from "react"


const Logo: React.FC<{}> = ({}) => {

  // logo animation
  const [logoState, setLogoState] = useState<"gpt" | "ppt">("ppt")
  useInitEffect(() => {
    toggleLogo()
  }, [])
  const toggleLogo = () => {
    const [a, b] = [250, 2000]
    const t = a + Math.random() * (b - a)
    setLogoState(prev => prev == "ppt" ? "gpt" : "ppt")
    setTimeout(toggleLogo, t)
  }

  return (
    <h1>
      {logoState == "ppt" && <span style={{ color: "red", textAlign: "right" }}>ppt</span>}
      {logoState == "gpt" && <span style={{ color: "green", textAlign: "right" }}>gpt</span>}
      <span style={{ marginLeft: ".25rem", opacity: .5 }}>kara</span><span>ok</span>
    </h1>
  )

}
export default Logo;
