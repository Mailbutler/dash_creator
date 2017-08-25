module DashCreator
  module ActsAsDashboardObject

    def self.included(base)
      base.extend ClassMethods
    end

    def ClassMethods
      def acts_as_dashboard_object(name, options = {})
        DashCreator::DashboardObject
            .find_or_create_by(
                name: name,
                code: name.underscore,
                info: {model_name: self.class.name},
                options: options
            )
      end
    end
  end
end
