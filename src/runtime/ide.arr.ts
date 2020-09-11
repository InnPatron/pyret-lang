const RUNTIME = require("./runtime.js");

RUNTIME.$setSpyMessageHandler((data: { message: string, loc: string}) => {

  // @ts-ignore
  if (dispatch) {
    const value = (data.message) ? data.message : undefined;
    // @ts-ignore
    dispatch({
      type: 'update',
      key: 'rhs',
      value: {
        tag: "spy-message",
        message: true,
        value,
        key: data.loc,
        loc: data.loc,
      },
    });
    console.log("Dispatch");
  } else {
    console.log("No available dispatch");
  }

  console.log("SPY MESSAGE");
});

RUNTIME.$setSpyValueHandler((data: { key: string, value: any, loc: string}) => {
  // @ts-ignore
  if (dispatch) {
    // @ts-ignore
    dispatch({
      type: 'update',
      key: 'rhs',
      value: {
        tag: "spy-value",
        value: {
          key: data.key,
          value: data.value,
        },
        key: data.loc,
        loc: data.loc,
      },
    });
    console.log("Dispatch");
  } else {
    console.log("No available dispatch");
  }


  console.log("SPY VALUE");
});
