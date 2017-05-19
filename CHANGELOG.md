## 2017-02-22, Version 5.0.0 (Stable), @lennym
* Fully deprecates `Controller#Error` - implementations should use `Controller#ValidationError` for validation errors
* Moves validation error message generation to render-time. Implementations can now modify error metadata in `getErrors` to add custom error behaviour

## 2017-02-22, Version 4.0.0 (Stable), @lennym
* Removes auto-completion of steps without fields. If needed declare this in a custom behaviour.