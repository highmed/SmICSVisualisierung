import styled from "styled-components"

export const ModuleContainerDIV = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* align-content: stretch; */
  /* border: 2px black solid; */
  padding: 10px;
  /* background: yellow; */
`

export const ChartContainerDIV = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  flex-grow: 1;
  flex-shrink: 1;
  display: flex;
  box-sizing: border-box;
  /* padding: 50px; */
  border: 2px black solid;
  overflow: hidden;
  /* background: green; */
`
export const RefreshBUTTON = styled.button`
  /* width: 30px;
  height: 30px; */
  width: 25px;
  height: 25px;

  position: absolute;
  right: 15px;
  cursor: pointer;
  border-radius: 50px;
  border: solid black 1px;

  &:hover {
    box-shadow: inset 0 0 10px black;
  }

  &:focus {
    outline: 0;
  }
`

// styled ocmponents mit svg funktioniert nicht ganz ?
// export const rootSVG = styled.svg`
//     height: 100%;
//     width: 100%;
// `
