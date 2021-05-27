package validation

import (
	"fmt"
	"strings"

	"github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
)

// ValidateCommands validates the devfile commands and checks:
// 1. there are no duplicate command ids
// 2. the command type is not invalid
// 3. if a command is part of a command group, there is a single default command
func ValidateCommands(commands []v1alpha2.Command, components []v1alpha2.Component) (err error) {
	groupKindCommandMap := make(map[v1alpha2.CommandGroupKind][]v1alpha2.Command)
	commandMap := getCommandsMap(commands)

	err = v1alpha2.CheckDuplicateKeys(commands)
	if err != nil {
		return err
	}

	for _, command := range commands {
		// parentCommands is a map to keep a track of all the parent commands when validating the composite command's subcommands recursively
		parentCommands := make(map[string]string)
		err = validateCommand(command, parentCommands, commandMap, components)
		if err != nil {
			return err
		}

		commandGroup := getGroup(command)
		if commandGroup != nil {
			groupKindCommandMap[commandGroup.Kind] = append(groupKindCommandMap[commandGroup.Kind], command)
		}
	}

	groupErrors := ""
	for groupKind, commands := range groupKindCommandMap {
		if err = validateGroup(commands); err != nil {
			groupErrors += fmt.Sprintf("\ncommand group %s error - %s", groupKind, err.Error())
		}
	}

	if len(groupErrors) > 0 {
		err = fmt.Errorf("%s", groupErrors)
	}

	return err
}

// validateCommand validates a given devfile command where parentCommands is a map to track all the parent commands when validating
// the composite command's subcommands recursively and devfileCommands is a map of command id to the devfile command
func validateCommand(command v1alpha2.Command, parentCommands map[string]string, devfileCommands map[string]v1alpha2.Command, components []v1alpha2.Component) (err error) {

	switch {
	case command.Composite != nil:
		return validateCompositeCommand(&command, parentCommands, devfileCommands, components)
	case command.Exec != nil || command.Apply != nil:
		return validateCommandComponent(command, components)
	case command.VscodeLaunch != nil:
		if command.VscodeLaunch.Uri != "" {
			return ValidateURI(command.VscodeLaunch.Uri)
		}
	case command.VscodeTask != nil:
		if command.VscodeTask.Uri != "" {
			return ValidateURI(command.VscodeTask.Uri)
		}
	default:
		err = fmt.Errorf("command %s type is invalid", command.Id)
	}

	return err
}

// validateGroup validates commands belonging to a specific group kind. If there are multiple commands belonging to the same group:
// 1. without any default, err out
// 2. with more than one default, err out
func validateGroup(commands []v1alpha2.Command) error {
	defaultCommandCount := 0

	if len(commands) > 1 {
		for _, command := range commands {
			if getGroup(command).IsDefault {
				defaultCommandCount++
			}
		}
	} else {
		return nil
	}

	if defaultCommandCount == 0 {
		return fmt.Errorf("there should be exactly one default command, currently there is no default command")
	} else if defaultCommandCount > 1 {
		return fmt.Errorf("there should be exactly one default command, currently there is more than one default command")
	}

	return nil
}

// getGroup returns the group the command belongs to, or nil if the command does not belong to a group
func getGroup(command v1alpha2.Command) *v1alpha2.CommandGroup {
	switch {
	case command.Composite != nil:
		return command.Composite.Group
	case command.Exec != nil:
		return command.Exec.Group
	case command.Apply != nil:
		return command.Apply.Group
	case command.VscodeLaunch != nil:
		return command.VscodeLaunch.Group
	case command.VscodeTask != nil:
		return command.VscodeTask.Group
	case command.Custom != nil:
		return command.Custom.Group

	default:
		return nil
	}
}

// validateCommandComponent validates the given exec or apply command, the command should map to a valid container component
func validateCommandComponent(command v1alpha2.Command, components []v1alpha2.Component) error {

	if command.Exec == nil && command.Apply == nil {
		return &InvalidCommandError{commandId: command.Id, reason: "should be of type exec or apply"}
	}

	var commandComponent string
	if command.Exec != nil {
		commandComponent = command.Exec.Component
	} else if command.Apply != nil {
		commandComponent = command.Apply.Component
	}

	// must map to a container component
	for _, component := range components {
		if component.Container != nil && commandComponent == component.Name {
			return nil
		}
	}
	return &InvalidCommandError{commandId: command.Id, reason: "command does not map to a container component"}
}

// validateCompositeCommand checks that the specified composite command is valid. The command:
// 1. should not reference itself via a subcommand
// 2. should not indirectly reference itself via a subcommand which is a composite command
// 3. should reference a valid devfile command
// 4. should have a valid exec sub command
// where parentCommands is a map to track all the parent commands when validating the composite command's subcommands recursilvely
// and devfileCommands is a map of command id to the devfile command
func validateCompositeCommand(command *v1alpha2.Command, parentCommands map[string]string, devfileCommands map[string]v1alpha2.Command, components []v1alpha2.Component) error {

	// Store the command ID in a map of parent commands
	parentCommands[command.Id] = command.Id

	if command.Composite == nil {
		return &InvalidCommandError{commandId: command.Id, reason: "should be of type composite"}
	}

	// Loop over the commands and validate that each command points to a command that's in the devfile
	for _, cmd := range command.Composite.Commands {
		if strings.ToLower(cmd) == command.Id {
			return &InvalidCommandError{commandId: command.Id, reason: "composite command cannot reference itself"}
		}

		// Don't allow commands to indirectly reference themselves, so check if the command equals any of the parent commands in the command tree
		_, ok := parentCommands[strings.ToLower(cmd)]
		if ok {
			return &InvalidCommandError{commandId: command.Id, reason: "composite command cannot indirectly reference itself"}
		}

		subCommand, ok := devfileCommands[strings.ToLower(cmd)]
		if !ok {
			return &InvalidCommandError{commandId: command.Id, reason: fmt.Sprintf("the command %q mentioned in the composite command does not exist in the devfile", cmd)}
		}

		err := validateCommand(subCommand, parentCommands, devfileCommands, components)
		if err != nil {
			return err
		}
		delete(parentCommands, cmd)
	}
	return nil
}